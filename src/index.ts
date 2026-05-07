import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import { flightdeckRouter } from './routes/flightdeck';

export const app = express();
const startedAt = Date.now();

app.use(helmet());
app.use(cors());
app.use(morgan('tiny'));
app.use(express.json({ limit: '4mb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'kinetic-flightdeck',
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    nodeEnv: env.nodeEnv,
    upstreams: {
      mcpSentinel: env.mcpSentinelUrl,
      agentCodex: env.agentCodexUrl,
      agentObserve: env.agentObserveUrl,
    },
  });
});

app.use('/api/flightdeck', flightdeckRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

if (require.main === module) {
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`kinetic-flightdeck listening on :${env.port}`);
  });
}
