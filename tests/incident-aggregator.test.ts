import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildIncidentSummary, filterIncidents, buildTimeline } from '../src/aggregators/incident-aggregator';
import { incidents } from '../src/data/incidents';

test('buildIncidentSummary: counts by status sum to total', () => {
  const s = buildIncidentSummary(incidents);
  assert.equal(s.open + s.acknowledged + s.resolved, s.total);
});

test('buildIncidentSummary: bySource covers all three pillars', () => {
  const s = buildIncidentSummary(incidents);
  assert.ok(s.bySource['mcp-sentinel'] >= 1);
  assert.ok(s.bySource['agent-codex'] >= 1);
  assert.ok(s.bySource['agentobserve'] >= 1);
});

test('buildIncidentSummary: top affected entities sorted by severity weight', () => {
  const s = buildIncidentSummary(incidents);
  // srv_internal_crm has the most critical+high incidents — should be top
  assert.equal(s.topAffectedEntities[0].entityId, 'srv_internal_crm');
});

test('filterIncidents: filters by source', () => {
  const sentinelOnly = filterIncidents(incidents, { source: 'mcp-sentinel' });
  assert.ok(sentinelOnly.every((i) => i.source === 'mcp-sentinel'));
  assert.ok(sentinelOnly.length >= 1);
});

test('filterIncidents: filters by severity', () => {
  const critical = filterIncidents(incidents, { severity: 'critical' });
  assert.ok(critical.every((i) => i.severity === 'critical'));
});

test('filterIncidents: combines multiple filters', () => {
  const filtered = filterIncidents(incidents, { status: 'open', source: 'mcp-sentinel' });
  assert.ok(filtered.every((i) => i.status === 'open' && i.source === 'mcp-sentinel'));
});

test('buildTimeline: returns incidents sorted newest first', () => {
  // Use a wide window so we definitely have results regardless of fixture dates
  const timeline = buildTimeline(incidents, 24 * 365);
  for (let i = 1; i < timeline.length; i++) {
    const prev = new Date(timeline[i - 1].detectedAt).getTime();
    const curr = new Date(timeline[i].detectedAt).getTime();
    assert.ok(prev >= curr, 'timeline should be newest first');
  }
});
