import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is missing; set it in backend/.env.');

function ask(prompt: string, secret = false): Promise<string> {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    throw new Error('Run this command in an interactive terminal so the password can be entered privately.');
  }

  return new Promise((resolve, reject) => {
    process.stdout.write(prompt);
    input.setRawMode(true);
    input.resume();
    let value = '';
    let finished = false;

    const finish = (error?: Error) => {
      if (finished) return;
      finished = true;
      input.removeListener('data', onData);
      input.setRawMode(false);
      input.pause();
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    };

    const onData = (buffer: Buffer) => {
      for (const character of buffer.toString('utf8')) {
        if (character === '\u0003') {
          finish(new Error('Cancelled.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          finish();
          return;
        }
        if (character === '\u007f' || character === '\b') {
          value = value.slice(0, -1);
          process.stdout.write('\b \b');
        } else if (character >= ' ') {
          value += character;
          process.stdout.write(secret ? '*' : character);
        }
      }
    };

    input.on('data', onData);
  });
}

async function main() {
  const fullNameAr = (await ask('الاسم العربي لمسؤول النظام: ')).trim();
  const username = (await ask('اسم المستخدم: ')).trim().toLowerCase();
  const email = (await ask('البريد الإلكتروني: ')).trim().toLowerCase();
  const password = await ask('كلمة المرور (لن تظهر أثناء الكتابة): ', true);
  const confirmation = await ask('أعد كتابة كلمة المرور: ', true);

  if (!fullNameAr || !username || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('الاسم واسم المستخدم والبريد الإلكتروني مطلوبة، والبريد يجب أن يكون صالحاً.');
  }
  if (password.length < 9 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('كلمة المرور يجب أن تكون 9 أحرف أو أرقام على الأقل وألا تتجاوز 72 بايتاً.');
  }
  if (password !== confirmation) throw new Error('كلمتا المرور غير متطابقتين.');

  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(97412026)');
    const existing = await client.query(
      `SELECT 1 FROM users
        WHERE role_code = 'system_admin' AND is_active = true
        LIMIT 1 FOR UPDATE`,
    );
    if (existing.rowCount) throw new Error('يوجد مسؤول نظام نشط بالفعل؛ لم يتم إنشاء حساب آخر.');

    const passwordHash = await bcrypt.hash(password, 12);
    await client.query(
      `INSERT INTO users (role_code, username, email, password_hash, full_name_ar, job_title_ar)
       VALUES ('system_admin', $1, $2, $3, $4, 'مدير النظام')`,
      [username, email, passwordHash, fullNameAr],
    );
    await client.query('COMMIT');
    console.log('تم إنشاء حساب مسؤول النظام الأول بنجاح. احتفظ باسم المستخدم والبريد اللذين أدخلتهما.');
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof Error && error.message.includes('duplicate key')) {
      throw new Error('اسم المستخدم أو البريد مستخدم مسبقاً؛ لم يتم إنشاء الحساب.');
    }
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'تعذر إنشاء الحساب الأول.');
  process.exitCode = 1;
});
