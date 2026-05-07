import type { UnifiedIncident, IncidentSeverity, IncidentSource } from '../data/incidents';

export interface IncidentSummary {
  total: number;
  open: number;
  acknowledged: number;
  resolved: number;
  bySeverity: Record<IncidentSeverity, number>;
  bySource: Record<IncidentSource, number>;
  topAffectedEntities: Array<{ entityId: string; incidentCount: number; severityScore: number }>;
}

const SEVERITY_WEIGHTS: Record<IncidentSeverity, number> = {
  critical: 100,
  high: 50,
  medium: 20,
  low: 5,
  info: 1,
};

export function buildIncidentSummary(incidents: UnifiedIncident[]): IncidentSummary {
  const bySeverity: Record<IncidentSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  const bySource: Record<IncidentSource, number> = { 'mcp-sentinel': 0, 'agent-codex': 0, 'agentobserve': 0 };

  for (const inc of incidents) {
    bySeverity[inc.severity]++;
    bySource[inc.source]++;
  }

  // Top affected entities — weighted by severity
  const entityScores = new Map<string, { incidentCount: number; severityScore: number }>();
  for (const inc of incidents) {
    if (inc.status === 'resolved') continue;
    const current = entityScores.get(inc.entityId) || { incidentCount: 0, severityScore: 0 };
    current.incidentCount++;
    current.severityScore += SEVERITY_WEIGHTS[inc.severity];
    entityScores.set(inc.entityId, current);
  }

  const topAffectedEntities = Array.from(entityScores.entries())
    .map(([entityId, scores]) => ({ entityId, ...scores }))
    .sort((a, b) => b.severityScore - a.severityScore)
    .slice(0, 5);

  return {
    total: incidents.length,
    open: incidents.filter((i) => i.status === 'open').length,
    acknowledged: incidents.filter((i) => i.status === 'acknowledged').length,
    resolved: incidents.filter((i) => i.status === 'resolved').length,
    bySeverity,
    bySource,
    topAffectedEntities,
  };
}

export function buildTimeline(incidents: UnifiedIncident[], hours = 24): UnifiedIncident[] {
  const cutoff = new Date(Date.now() - hours * 3600 * 1000);
  return [...incidents]
    .filter((i) => new Date(i.detectedAt) >= cutoff)
    .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
}

export function filterIncidents(
  incidents: UnifiedIncident[],
  filters: {
    source?: IncidentSource;
    severity?: IncidentSeverity;
    status?: 'open' | 'acknowledged' | 'resolved';
    entityId?: string;
  }
): UnifiedIncident[] {
  return incidents.filter((inc) => {
    if (filters.source && inc.source !== filters.source) return false;
    if (filters.severity && inc.severity !== filters.severity) return false;
    if (filters.status && inc.status !== filters.status) return false;
    if (filters.entityId && inc.entityId !== filters.entityId) return false;
    return true;
  });
}
