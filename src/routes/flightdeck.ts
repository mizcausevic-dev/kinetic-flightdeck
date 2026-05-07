import { Router } from 'express';
import { fleet, findEntity } from '../data/fleet';
import { incidents } from '../data/incidents';
import { buildFleetPosture, evaluateEntity } from '../aggregators/posture-aggregator';
import { buildIncidentSummary, buildTimeline, filterIncidents } from '../aggregators/incident-aggregator';
import { buildRiskMatrix } from '../aggregators/risk-matrix';
import { buildOwnerMap } from '../aggregators/owner-map';

export const flightdeckRouter = Router();

// GET /api/flightdeck/posture — full fleet posture rollup
flightdeckRouter.get('/posture', (_req, res) => {
  res.json(buildFleetPosture(fleet));
});

// GET /api/flightdeck/posture/:entityId — single entity posture
flightdeckRouter.get('/posture/:entityId', (req, res) => {
  const entity = findEntity(req.params.entityId);
  if (!entity) {
    res.status(404).json({ error: `Entity ${req.params.entityId} not found.` });
    return;
  }
  res.json(evaluateEntity(entity));
});

// GET /api/flightdeck/incidents — full incident feed with optional filters
flightdeckRouter.get('/incidents', (req, res) => {
  const filtered = filterIncidents(incidents, {
    source: req.query.source as never,
    severity: req.query.severity as never,
    status: req.query.status as never,
    entityId: req.query.entityId as string | undefined,
  });
  res.json({
    summary: buildIncidentSummary(filtered),
    incidents: filtered,
  });
});

// GET /api/flightdeck/timeline?hours=24 — recent incident timeline
flightdeckRouter.get('/timeline', (req, res) => {
  const hours = parseInt((req.query.hours as string) || '24', 10);
  res.json({
    windowHours: hours,
    incidents: buildTimeline(incidents, hours),
  });
});

// GET /api/flightdeck/risk-matrix — N×M risk matrix
flightdeckRouter.get('/risk-matrix', (_req, res) => {
  res.json(buildRiskMatrix(fleet));
});

// GET /api/flightdeck/owners — accountability rollup by team
flightdeckRouter.get('/owners', (_req, res) => {
  res.json({
    teams: buildOwnerMap(fleet, incidents),
  });
});

// GET /api/flightdeck/summary — Monday-morning operator view
flightdeckRouter.get('/summary', (_req, res) => {
  const posture = buildFleetPosture(fleet);
  const incidentSummary = buildIncidentSummary(incidents);
  const owners = buildOwnerMap(fleet, incidents);
  const riskMatrix = buildRiskMatrix(fleet);

  res.json({
    generatedAt: new Date().toISOString(),
    headline: {
      totalEntities: posture.summary.totalEntities,
      productionAtRisk: posture.summary.productionAtRisk,
      averageComposite: posture.summary.averageComposite,
      openIncidents: incidentSummary.open,
      criticalIncidents: incidentSummary.bySeverity.critical,
      teamsNeedingAttention: owners.filter((o) => o.status === 'attention-needed').length,
    },
    fleetSummary: posture.summary,
    incidentSummary,
    riskSummary: riskMatrix.summary,
    topRiskEntities: posture.summary.topRisks.slice(0, 3),
    teamsNeedingAttention: owners.filter((o) => o.status === 'attention-needed'),
  });
});
