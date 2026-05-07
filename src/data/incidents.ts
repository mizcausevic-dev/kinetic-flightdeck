// Unified incident feed across all three pillars.

export type IncidentSource = 'mcp-sentinel' | 'agent-codex' | 'agentobserve';
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface UnifiedIncident {
  incidentId: string;
  source: IncidentSource;
  severity: IncidentSeverity;
  entityId: string;
  category: string;
  message: string;
  detectedAt: string;
  status: 'open' | 'acknowledged' | 'resolved';
  assignedTo: string | null;
}

export const incidents: UnifiedIncident[] = [
  {
    incidentId: 'inc_2026_05_07_001',
    source: 'mcp-sentinel',
    severity: 'critical',
    entityId: 'srv_internal_crm',
    category: 'auth-posture',
    message: 'Production server registered with authMethod=none and destructive tools exposed.',
    detectedAt: '2026-05-07T09:15:00Z',
    status: 'open',
    assignedTo: 'revops',
  },
  {
    incidentId: 'inc_2026_05_07_002',
    source: 'agent-codex',
    severity: 'high',
    entityId: 'srv_internal_crm',
    category: 'soc2-violation',
    message: 'Decision violated SOC2 CC6.1: data accessed without authentication trail.',
    detectedAt: '2026-05-07T09:18:00Z',
    status: 'open',
    assignedTo: 'revops',
  },
  {
    incidentId: 'inc_2026_05_07_003',
    source: 'agentobserve',
    severity: 'high',
    entityId: 'srv_internal_crm',
    category: 'cost-overrun',
    message: 'Cost budget exceeded: $18.50 actual vs $15.00 budget (+23%).',
    detectedAt: '2026-05-07T08:45:00Z',
    status: 'acknowledged',
    assignedTo: 'revops',
  },
  {
    incidentId: 'inc_2026_05_06_004',
    source: 'mcp-sentinel',
    severity: 'medium',
    entityId: 'srv_github_org',
    category: 'prompt-injection-attempt',
    message: 'Prompt-injection signature detected in tool invocation; blocked at runtime.',
    detectedAt: '2026-05-06T14:22:00Z',
    status: 'resolved',
    assignedTo: 'devx',
  },
  {
    incidentId: 'inc_2026_05_07_005',
    source: 'agentobserve',
    severity: 'high',
    entityId: 'agt_revenue_forecast',
    category: 'cost-overrun',
    message: 'Cost budget exceeded: $31.20 actual vs $25.00 budget (+25%).',
    detectedAt: '2026-05-07T07:30:00Z',
    status: 'acknowledged',
    assignedTo: 'finance-eng',
  },
  {
    incidentId: 'inc_2026_05_07_006',
    source: 'agentobserve',
    severity: 'medium',
    entityId: 'agt_revenue_forecast',
    category: 'sla-breach',
    message: 'P95 latency 4800ms exceeds SLA target of 3000ms.',
    detectedAt: '2026-05-07T08:15:00Z',
    status: 'open',
    assignedTo: 'finance-eng',
  },
  {
    incidentId: 'inc_2026_05_04_007',
    source: 'mcp-sentinel',
    severity: 'medium',
    entityId: 'agt_devops_assistant',
    category: 'prompt-injection-attempt',
    message: 'Role-hijack pattern detected; agent quarantined for 60 minutes.',
    detectedAt: '2026-05-04T11:00:00Z',
    status: 'resolved',
    assignedTo: 'sre',
  },
  {
    incidentId: 'inc_2026_05_07_008',
    source: 'agent-codex',
    severity: 'medium',
    entityId: 'srv_github_org',
    category: 'eu-ai-act',
    message: 'Decision flagged under EU AI Act Article 13: insufficient transparency artifact.',
    detectedAt: '2026-05-07T06:00:00Z',
    status: 'open',
    assignedTo: 'devx',
  },
  {
    incidentId: 'inc_2026_05_05_009',
    source: 'agentobserve',
    severity: 'low',
    entityId: 'srv_github_org',
    category: 'regression',
    message: 'Tool selection accuracy regressed 4.2% over 7-day window; within tolerance.',
    detectedAt: '2026-05-05T18:00:00Z',
    status: 'resolved',
    assignedTo: 'devx',
  },
];
