import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { db } from './db.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import workDateExceptionsRouter from './routes/work-date-exceptions.js';
import workLogsRouter from './routes/work-logs.js';
import assignmentsRouter from './routes/assignments.js';
import projectsRouter from './routes/projects.js';
import circularsRouter from './routes/circulars.js';
import notificationsRouter from './routes/notifications.js';
import systemSettingsRouter from './routes/system-settings.js';
import rolePermissionsRouter from './routes/role-permissions.js';
import accountTypesRouter from './routes/account-types.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const frontendDirectory = [
  process.env.FRONTEND_DIST_DIR,
  path.resolve(process.cwd(), 'dist'),
  path.resolve(process.cwd(), '../dist'),
].filter((directory): directory is string => Boolean(directory)).find((directory) => existsSync(path.join(directory, 'index.html')))
  ?? path.resolve(process.cwd(), 'dist');
const frontendIndex = path.join(frontendDirectory, 'index.html');

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/work-date-exceptions', workDateExceptionsRouter);
app.use('/api/work-logs', workLogsRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/circulars', circularsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/system-settings', systemSettingsRouter);
app.use('/api/role-permissions', rolePermissionsRouter);
app.use('/api/account-types', accountTypesRouter);

app.get('/api/health', async (_request, response) => {
  try {
    await db.query('SELECT 1');
    response.json({ status: 'ok', database: 'connected' });
  } catch {
    response.status(503).json({ status: 'unavailable', database: 'disconnected' });
  }
});

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'المسار غير موجود' });
});

if (existsSync(frontendIndex)) {
  app.use(express.static(frontendDirectory));
  app.get(/.*/, (_request, response) => response.sendFile(frontendIndex));
}

app.use((_request, response) => {
  response.status(404).json({ error: 'المسار غير موجود' });
});

export default app;

const server = process.env.VERCEL === '1'
  ? undefined
  : app.listen(port, '0.0.0.0', () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });

async function shutdown() {
  if (!server) return;
  server.close(async () => {
    await db.end();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
