import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing. Add it to backend/.env.');
}

export const db = new Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

db.on('error', () => {
  // Do not log connection errors verbatim because they may contain connection details.
  console.error('Unexpected database connection error. Check Neon availability and backend configuration.');
});
