import type { FleetEntity } from '../data/fleet';
import type { UnifiedIncident } from '../data/incidents';

export interface OwnerScorecard {
  ownerTeam: string;
  ownedEntities: number;
  productionEntities: number;
  averageSecurityScore: number;
  averageGovernanceScore: number;
  averageOperationsScore: number;
  openIncidents: number;
  monthlyCostUsd: number;
  status: 'healthy' | 'review' | 'attention-needed';
}

export function buildOwnerMap(fleet: FleetEntity[], incidents: UnifiedIncident[]): OwnerScorecard[] {
  const teams = new Map<string, FleetEntity[]>();
  for (const entity of fleet) {
    const existing = teams.get(entity.ownerTeam) || [];
    existing.push(entity);
    teams.set(entity.ownerTeam, existing);
  }

  const scorecards: OwnerScorecard[] = [];
  for (const [team, entities] of teams.entries()) {
    const teamEntityIds = new Set(entities.map((e) => e.entityId));
    const teamOpenIncidents = incidents.filter(
      (i) => teamEntityIds.has(i.entityId) && i.status !== 'resolved'
    ).length;

    const production = entities.filter((e) => e.environment === 'production').length;
    const avgSec = Math.round(entities.reduce((s, e) => s + e.security.postureScore, 0) / entities.length);
    const avgGov = Math.round(entities.reduce((s, e) => s + e.governance.postureScore, 0) / entities.length);
    const avgOps = Math.round(entities.reduce((s, e) => s + e.operations.postureScore, 0) / entities.length);
    const monthlyCost = Math.round(entities.reduce((s, e) => s + e.operations.costUsdLast24h * 30, 0));

    let status: 'healthy' | 'review' | 'attention-needed';
    const minScore = Math.min(avgSec, avgGov, avgOps);
    if (minScore >= 80 && teamOpenIncidents === 0) status = 'healthy';
    else if (minScore >= 60 && teamOpenIncidents <= 2) status = 'review';
    else status = 'attention-needed';

    scorecards.push({
      ownerTeam: team,
      ownedEntities: entities.length,
      productionEntities: production,
      averageSecurityScore: avgSec,
      averageGovernanceScore: avgGov,
      averageOperationsScore: avgOps,
      openIncidents: teamOpenIncidents,
      monthlyCostUsd: monthlyCost,
      status,
    });
  }

  return scorecards.sort((a, b) => {
    // Sort attention-needed first, then by open incidents descending
    const statusOrder = { 'attention-needed': 0, review: 1, healthy: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
    return b.openIncidents - a.openIncidents;
  });
}
