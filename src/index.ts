import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { env } from './config/env';
import { flightdeckRouter } from './routes/flightdeck';

export const app = express();
const startedAt = Date.now();

app.use(helmet());
app.use((_req, res, next) => {
  res.setHeader('X-Data-Mode', 'synthetic-demo');
  next();
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'kinetic-flightdeck',
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    nodeEnv: env.nodeEnv,
    dataMode: 'synthetic-demo',
    upstreamsConnected: false,
  });
});

app.use('/api/flightdeck', flightdeckRouter);
app.use('/preview', express.static(path.resolve(__dirname, '../dashboard-preview')));

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

if (require.main === module) {
  app.listen(env.port, env.host, () => {
    // eslint-disable-next-line no-console
    console.log(`kinetic-flightdeck listening on ${env.host}:${env.port}`);
  });
}
