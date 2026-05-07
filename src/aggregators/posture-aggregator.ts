import type { FleetEntity } from '../data/fleet';

export type FlightdeckStatus = 'healthy' | 'review' | 'degraded' | 'critical';

export interface FlightdeckPosture {
  entityId: string;
  entityType: 'mcp_server' | 'ai_agent';
  name: string;
  owner: string;
  ownerTeam: string;
  environment: 'production' | 'staging' | 'development';
  composite: {
    overall: number;
    security: number;
    governance: number;
    operations: number;
  };
  status: FlightdeckStatus;
  signals: {
    securityIncidents: number;
    governanceViolations: number;
    costAnomalies: number;
    slaBreaches: number;
  };
  recommendedNextAction: string;
}

// Composite score weights — security gets the highest weight because in
// platform engineering, a security incident dominates other concerns.
// Governance second (compliance is binary in regulated environments).
// Operations third (degradation is recoverable; breach is not).
const WEIGHTS = {
  security: 0.45,
  governance: 0.30,
  operations: 0.25,
};

export function evaluateEntity(entity: FleetEntity): FlightdeckPosture {
  const security = entity.security.postureScore;
  const governance = entity.governance.postureScore;
  const operations = entity.operations.postureScore;

  const overall = Math.round(
    security * WEIGHTS.security +
    governance * WEIGHTS.governance +
    operations * WEIGHTS.operations
  );

  // Cost anomalies = budget overruns
  const costAnomalies = entity.operations.costUsdLast24h > entity.operations.costBudgetUsd ? 1 : 0;

  const signals = {
    securityIncidents: entity.security.openIncidents,
    governanceViolations: entity.governance.blockedDecisions > 10 ? entity.governance.blockedDecisions : 0,
    costAnomalies,
    slaBreaches: entity.operations.slaBreaches,
  };

  // Status decision tree — any single critical signal can override the composite score.
  // This is the "platform thinking" doctrine: a 90 composite with one critical
  // security incident is still critical.
  let status: FlightdeckStatus;
  let recommendedNextAction: string;

  const hasCriticalSecurity = security < 50 || signals.securityIncidents >= 2;
  const hasMultipleSlaBreaches = signals.slaBreaches >= 3;
  const hasMajorBudgetBreach = costAnomalies > 0 && entity.operations.costUsdLast24h > entity.operations.costBudgetUsd * 1.2;

  if (hasCriticalSecurity || (overall < 55 && entity.environment === 'production')) {
    status = 'critical';
    recommendedNextAction = 'Quarantine entity; engage SecOps + platform on-call; suspend production traffic.';
  } else if (hasMultipleSlaBreaches || hasMajorBudgetBreach || overall < 70) {
    status = 'degraded';
    recommendedNextAction = 'Open incident with owning team; schedule remediation review within 48 hours.';
  } else if (signals.securityIncidents > 0 || signals.governanceViolations > 0 || overall < 85) {
    status = 'review';
    recommendedNextAction = 'Route to weekly platform-engineering review; no immediate action required.';
  } else {
    status = 'healthy';
    recommendedNextAction = 'Continue scheduled posture polling on default cadence.';
  }

  return {
    entityId: entity.entityId,
    entityType: entity.entityType,
    name: entity.name,
    owner: entity.owner,
    ownerTeam: entity.ownerTeam,
    environment: entity.environment,
    composite: { overall, security, governance, operations },
    status,
    signals,
    recommendedNextAction,
  };
}

export interface FleetPostureSummary {
  totalEntities: number;
  healthy: number;
  review: number;
  degraded: number;
  critical: number;
  averageComposite: number;
  productionAtRisk: number; // production entities in degraded or critical
  topRisks: FlightdeckPosture[]; // worst 5 by overall score
}

export function buildFleetPosture(fleet: FleetEntity[]): {
  summary: FleetPostureSummary;
  entities: FlightdeckPosture[];
} {
  const entities = fleet.map(evaluateEntity);

  const healthy = entities.filter((e) => e.status === 'healthy').length;
  const review = entities.filter((e) => e.status === 'review').length;
  const degraded = entities.filter((e) => e.status === 'degraded').length;
  const critical = entities.filter((e) => e.status === 'critical').length;

  const averageComposite = entities.length === 0
    ? 0
    : Math.round(entities.reduce((sum, e) => sum + e.composite.overall, 0) / entities.length);

  const productionAtRisk = entities.filter(
    (e) => e.environment === 'production' && (e.status === 'degraded' || e.status === 'critical')
  ).length;

  const topRisks = [...entities]
    .sort((a, b) => a.composite.overall - b.composite.overall)
    .slice(0, 5);

  return {
    summary: {
      totalEntities: entities.length,
      healthy,
      review,
      degraded,
      critical,
      averageComposite,
      productionAtRisk,
      topRisks,
    },
    entities,
  };
}
