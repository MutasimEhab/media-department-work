import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { db } from './db.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);

app.get('/api/health', async (_request, response) => {
  try {
    await db.query('SELECT 1');
    response.json({ status: 'ok', database: 'connected' });
  } catch {
    response.status(503).json({ status: 'unavailable', database: 'disconnected' });
  }
});

app.use((_request, response) => {
  response.status(404).json({ error: 'المسار غير موجود' });
});

const server = app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});

async function shutdown() {
  server.close(async () => {
    await db.end();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
