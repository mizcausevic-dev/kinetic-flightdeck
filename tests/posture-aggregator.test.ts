import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateEntity, buildFleetPosture } from '../src/aggregators/posture-aggregator';
import { fleet } from '../src/data/fleet';

test('evaluateEntity: healthy production server returns healthy status', () => {
  const slack = fleet.find((e) => e.entityId === 'srv_slack_enterprise')!;
  const result = evaluateEntity(slack);
  assert.equal(result.status, 'healthy');
  assert.ok(result.composite.overall >= 85);
});

test('evaluateEntity: critical security posture overrides composite score', () => {
  const crm = fleet.find((e) => e.entityId === 'srv_internal_crm')!;
  const result = evaluateEntity(crm);
  assert.equal(result.status, 'critical');
  // Even though some scores are higher, security < 50 forces critical
  assert.ok(result.composite.security < 50);
});

test('evaluateEntity: signals reflect raw incident counts', () => {
  const crm = fleet.find((e) => e.entityId === 'srv_internal_crm')!;
  const result = evaluateEntity(crm);
  assert.ok(result.signals.securityIncidents >= 2);
  assert.ok(result.signals.slaBreaches >= 3);
  assert.equal(result.signals.costAnomalies, 1);
});

test('buildFleetPosture: counts statuses correctly across the fleet', () => {
  const result = buildFleetPosture(fleet);
  assert.equal(result.summary.totalEntities, fleet.length);
  const statusSum = result.summary.healthy + result.summary.review + result.summary.degraded + result.summary.critical;
  assert.equal(statusSum, fleet.length);
});

test('buildFleetPosture: topRisks sorted by ascending overall score', () => {
  const result = buildFleetPosture(fleet);
  const overalls = result.summary.topRisks.map((e) => e.composite.overall);
  for (let i = 1; i < overalls.length; i++) {
    assert.ok(overalls[i] >= overalls[i - 1], 'topRisks should be ascending by overall');
  }
});

test('buildFleetPosture: identifies production entities at risk', () => {
  const result = buildFleetPosture(fleet);
  // Internal CRM and Revenue Forecast are both in production with bad posture
  assert.ok(result.summary.productionAtRisk >= 2);
});
