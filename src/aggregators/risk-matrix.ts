import type { FleetEntity } from '../data/fleet';

export type RiskDimension = 'security' | 'governance' | 'cost' | 'sla' | 'compliance';
export type RiskLevel = 'green' | 'yellow' | 'orange' | 'red';

export interface RiskCell {
  entityId: string;
  dimension: RiskDimension;
  level: RiskLevel;
  rationale: string;
}

export interface RiskMatrix {
  dimensions: RiskDimension[];
  entities: string[];
  cells: RiskCell[];
  summary: Record<RiskLevel, number>;
}

function scoreToLevel(score: number): RiskLevel {
  if (score >= 85) return 'green';
  if (score >= 70) return 'yellow';
  if (score >= 50) return 'orange';
  return 'red';
}

function evaluateCost(entity: FleetEntity): { level: RiskLevel; rationale: string } {
  const ratio = entity.operations.costUsdLast24h / entity.operations.costBudgetUsd;
  if (ratio < 0.7) return { level: 'green', rationale: `Cost ${(ratio * 100).toFixed(0)}% of budget — comfortable.` };
  if (ratio < 0.95) return { level: 'yellow', rationale: `Cost ${(ratio * 100).toFixed(0)}% of budget — within tolerance.` };
  if (ratio < 1.15) return { level: 'orange', rationale: `Cost ${(ratio * 100).toFixed(0)}% of budget — review variance.` };
  return { level: 'red', rationale: `Cost ${(ratio * 100).toFixed(0)}% of budget — material overrun.` };
}

function evaluateSla(entity: FleetEntity): { level: RiskLevel; rationale: string } {
  const breaches = entity.operations.slaBreaches;
  if (breaches === 0) return { level: 'green', rationale: 'No SLA breaches in 24h window.' };
  if (breaches <= 2) return { level: 'yellow', rationale: `${breaches} SLA breach(es) — elevated but not critical.` };
  if (breaches <= 5) return { level: 'orange', rationale: `${breaches} SLA breaches — degraded service.` };
  return { level: 'red', rationale: `${breaches} SLA breaches — service materially impaired.` };
}

function evaluateCompliance(entity: FleetEntity): { level: RiskLevel; rationale: string } {
  const frameworks = entity.governance.activeFrameworks.length;
  const blocked = entity.governance.blockedDecisions;
  if (frameworks >= 2 && blocked < 5) return { level: 'green', rationale: `Multi-framework coverage; ${blocked} blocks today.` };
  if (frameworks >= 1 && blocked < 15) return { level: 'yellow', rationale: `Single-framework coverage; ${blocked} blocks today.` };
  if (blocked < 25) return { level: 'orange', rationale: `${blocked} compliance blocks — investigate trend.` };
  return { level: 'red', rationale: `${blocked} compliance blocks — pattern of policy failure.` };
}

export function buildRiskMatrix(fleet: FleetEntity[]): RiskMatrix {
  const dimensions: RiskDimension[] = ['security', 'governance', 'cost', 'sla', 'compliance'];
  const entities = fleet.map((e) => e.entityId);
  const cells: RiskCell[] = [];
  const summary: Record<RiskLevel, number> = { green: 0, yellow: 0, orange: 0, red: 0 };

  for (const entity of fleet) {
    // security
    const secLevel = scoreToLevel(entity.security.postureScore);
    cells.push({
      entityId: entity.entityId,
      dimension: 'security',
      level: secLevel,
      rationale: `Security posture ${entity.security.postureScore}/100; ${entity.security.openIncidents} open incident(s).`,
    });
    summary[secLevel]++;

    // governance
    const govLevel = scoreToLevel(entity.governance.postureScore);
    cells.push({
      entityId: entity.entityId,
      dimension: 'governance',
      level: govLevel,
      rationale: `Governance posture ${entity.governance.postureScore}/100.`,
    });
    summary[govLevel]++;

    // cost
    const costEval = evaluateCost(entity);
    cells.push({ entityId: entity.entityId, dimension: 'cost', level: costEval.level, rationale: costEval.rationale });
    summary[costEval.level]++;

    // sla
    const slaEval = evaluateSla(entity);
    cells.push({ entityId: entity.entityId, dimension: 'sla', level: slaEval.level, rationale: slaEval.rationale });
    summary[slaEval.level]++;

    // compliance
    const compEval = evaluateCompliance(entity);
    cells.push({ entityId: entity.entityId, dimension: 'compliance', level: compEval.level, rationale: compEval.rationale });
    summary[compEval.level]++;
  }

  return { dimensions, entities, cells, summary };
}
