// Mock fleet data simulating what flightdeck aggregates from mcp-sentinel,
// agent-codex, and agentobserve in a real deployment.
// In production, these would come from polling those services or shared storage.

export interface FleetEntity {
  entityId: string;
  entityType: 'mcp_server' | 'ai_agent';
  name: string;
  owner: string;
  ownerTeam: string;
  environment: 'production' | 'staging' | 'development';
  registeredAt: string;
  // Per-pillar raw signals
  security: {
    postureScore: number; // from mcp-sentinel
    openIncidents: number;
    lastInjectionAttempt: string | null;
  };
  governance: {
    postureScore: number; // from agent-codex
    decisionsLast24h: number;
    blockedDecisions: number;
    activeFrameworks: string[]; // soc2, eu-ai-act, etc
  };
  operations: {
    postureScore: number; // from agentobserve
    runsLast24h: number;
    costUsdLast24h: number;
    costBudgetUsd: number;
    slaBreaches: number;
    p95LatencyMs: number;
  };
}

export const fleet: FleetEntity[] = [
  {
    entityId: 'srv_jira_prod',
    entityType: 'mcp_server',
    name: 'Jira Cloud MCP',
    owner: 'sara.k',
    ownerTeam: 'platform-integrations',
    environment: 'production',
    registeredAt: '2026-02-15T10:00:00Z',
    security: { postureScore: 92, openIncidents: 0, lastInjectionAttempt: null },
    governance: { postureScore: 95, decisionsLast24h: 1240, blockedDecisions: 4, activeFrameworks: ['soc2', 'iso27001'] },
    operations: { postureScore: 88, runsLast24h: 1240, costUsdLast24h: 14.2, costBudgetUsd: 25.0, slaBreaches: 0, p95LatencyMs: 480 },
  },
  {
    entityId: 'srv_github_org',
    entityType: 'mcp_server',
    name: 'GitHub Org MCP',
    owner: 'devx',
    ownerTeam: 'developer-experience',
    environment: 'production',
    registeredAt: '2026-01-22T10:00:00Z',
    security: { postureScore: 78, openIncidents: 1, lastInjectionAttempt: '2026-05-06T14:22:00Z' },
    governance: { postureScore: 82, decisionsLast24h: 856, blockedDecisions: 12, activeFrameworks: ['soc2', 'eu-ai-act'] },
    operations: { postureScore: 85, runsLast24h: 856, costUsdLast24h: 9.8, costBudgetUsd: 20.0, slaBreaches: 1, p95LatencyMs: 620 },
  },
  {
    entityId: 'srv_internal_crm',
    entityType: 'mcp_server',
    name: 'Internal CRM Bridge',
    owner: 'revops',
    ownerTeam: 'revops',
    environment: 'production',
    registeredAt: '2026-04-01T10:00:00Z',
    security: { postureScore: 35, openIncidents: 3, lastInjectionAttempt: '2026-05-07T09:15:00Z' },
    governance: { postureScore: 48, decisionsLast24h: 320, blockedDecisions: 22, activeFrameworks: ['soc2'] },
    operations: { postureScore: 62, runsLast24h: 320, costUsdLast24h: 18.5, costBudgetUsd: 15.0, slaBreaches: 4, p95LatencyMs: 1840 },
  },
  {
    entityId: 'srv_slack_enterprise',
    entityType: 'mcp_server',
    name: 'Slack Enterprise MCP',
    owner: 'collab-platform',
    ownerTeam: 'collab-platform',
    environment: 'production',
    registeredAt: '2026-03-10T10:00:00Z',
    security: { postureScore: 88, openIncidents: 0, lastInjectionAttempt: null },
    governance: { postureScore: 90, decisionsLast24h: 2100, blockedDecisions: 3, activeFrameworks: ['soc2', 'iso27001'] },
    operations: { postureScore: 92, runsLast24h: 2100, costUsdLast24h: 22.0, costBudgetUsd: 30.0, slaBreaches: 0, p95LatencyMs: 320 },
  },
  {
    entityId: 'agt_support_triage',
    entityType: 'ai_agent',
    name: 'Support Triage Agent',
    owner: 'support-eng',
    ownerTeam: 'support-engineering',
    environment: 'production',
    registeredAt: '2026-02-20T10:00:00Z',
    security: { postureScore: 84, openIncidents: 0, lastInjectionAttempt: null },
    governance: { postureScore: 88, decisionsLast24h: 540, blockedDecisions: 8, activeFrameworks: ['soc2'] },
    operations: { postureScore: 79, runsLast24h: 540, costUsdLast24h: 12.4, costBudgetUsd: 20.0, slaBreaches: 0, p95LatencyMs: 2200 },
  },
  {
    entityId: 'agt_revenue_forecast',
    entityType: 'ai_agent',
    name: 'Revenue Forecast Agent',
    owner: 'finance-eng',
    ownerTeam: 'finance-engineering',
    environment: 'production',
    registeredAt: '2026-04-05T10:00:00Z',
    security: { postureScore: 76, openIncidents: 0, lastInjectionAttempt: null },
    governance: { postureScore: 72, decisionsLast24h: 48, blockedDecisions: 6, activeFrameworks: ['soc2', 'eu-ai-act'] },
    operations: { postureScore: 55, runsLast24h: 48, costUsdLast24h: 31.2, costBudgetUsd: 25.0, slaBreaches: 2, p95LatencyMs: 4800 },
  },
  {
    entityId: 'agt_devops_assistant',
    entityType: 'ai_agent',
    name: 'DevOps Assistant',
    owner: 'sre',
    ownerTeam: 'sre',
    environment: 'staging',
    registeredAt: '2026-04-28T10:00:00Z',
    security: { postureScore: 70, openIncidents: 1, lastInjectionAttempt: '2026-05-04T11:00:00Z' },
    governance: { postureScore: 75, decisionsLast24h: 120, blockedDecisions: 4, activeFrameworks: ['iso27001'] },
    operations: { postureScore: 80, runsLast24h: 120, costUsdLast24h: 4.5, costBudgetUsd: 10.0, slaBreaches: 0, p95LatencyMs: 1100 },
  },
];

export function findEntity(id: string): FleetEntity | undefined {
  return fleet.find((e) => e.entityId === id);
}
