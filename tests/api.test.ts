import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { after, before, test } from 'node:test';
import request from 'supertest';
import { app } from '../src/index';

let server: Server;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
});
after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('health and summary disclose synthetic fixture mode without upstream URLs', async () => {
  const client = request.agent(server);
  const health = await client.get('/health').expect(200);
  assert.equal(health.headers['x-data-mode'], 'synthetic-demo');
  assert.equal(health.body.dataMode, 'synthetic-demo');
  assert.equal(health.body.upstreamsConnected, false);
  assert.equal('upstreams' in health.body, false);

  const summary = await client.get('/api/flightdeck/summary').expect(200);
  assert.equal(summary.body.dataMode, 'synthetic-demo');
  assert.equal(summary.body.headline.totalEntities, 7);
});

test('API rejects malformed filters and timeline windows', async () => {
  const client = request.agent(server);
  await client.get('/api/flightdeck/incidents?severity=bogus').expect(400);
  await client.get('/api/flightdeck/incidents?source[]=agentobserve').expect(400);
  await client.get('/api/flightdeck/timeline?hours=24junk').expect(400);
  await client.get('/api/flightdeck/timeline?hours=-1').expect(400);
  await client.get('/api/flightdeck/timeline?hours=169').expect(400);
  const valid = await client.get('/api/flightdeck/incidents?source=agentobserve').expect(200);
  assert.ok(valid.body.incidents.length > 0);
  assert.ok(valid.body.incidents.every((incident: { source: string }) => incident.source === 'agentobserve'));
});

test('preview loads only from same origin and no permissive CORS header is set', async () => {
  const client = request.agent(server);
  const preview = await client.get('/preview/').expect(200);
  assert.match(preview.text, /Illustrative fixture data/);
  assert.match(preview.text, /\/preview\/app\.js/);
  await client.get('/preview/app.js').expect(200);
  const health = await client.get('/health').set('Origin', 'https://example.com').expect(200);
  assert.equal(health.headers['access-control-allow-origin'], undefined);
});
