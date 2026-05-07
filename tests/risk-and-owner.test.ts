import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRiskMatrix } from '../src/aggregators/risk-matrix';
import { buildOwnerMap } from '../src/aggregators/owner-map';
import { fleet } from '../src/data/fleet';
import { incidents } from '../src/data/incidents';

test('buildRiskMatrix: creates one cell per entity-dimension pair', () => {
  const matrix = buildRiskMatrix(fleet);
  const expected = fleet.length * matrix.dimensions.length;
  assert.equal(matrix.cells.length, expected);
});

test('buildRiskMatrix: every dimension covered', () => {
  const matrix = buildRiskMatrix(fleet);
  assert.deepEqual(matrix.dimensions.sort(), ['compliance', 'cost', 'governance', 'security', 'sla']);
});

test('buildRiskMatrix: summary counts equal total cells', () => {
  const matrix = buildRiskMatrix(fleet);
  const sum = matrix.summary.green + matrix.summary.yellow + matrix.summary.orange + matrix.summary.red;
  assert.equal(sum, matrix.cells.length);
});

test('buildRiskMatrix: cost overrun produces red or orange level', () => {
  const matrix = buildRiskMatrix(fleet);
  // srv_internal_crm has cost ratio > 1.2 — should be red
  const crmCostCell = matrix.cells.find((c) => c.entityId === 'srv_internal_crm' && c.dimension === 'cost');
  assert.ok(crmCostCell);
  assert.ok(['orange', 'red'].includes(crmCostCell!.level));
});

test('buildOwnerMap: sums across teams equal total entities', () => {
  const teams = buildOwnerMap(fleet, incidents);
  const totalOwned = teams.reduce((sum, t) => sum + t.ownedEntities, 0);
  assert.equal(totalOwned, fleet.length);
});

test('buildOwnerMap: attention-needed teams sorted first', () => {
  const teams = buildOwnerMap(fleet, incidents);
  // revops team has critical CRM — should be attention-needed and first
  const firstTeam = teams[0];
  assert.equal(firstTeam.status, 'attention-needed');
});
