# Kinetic Flightdeck

[![CI](https://github.com/mizcausevic-dev/kinetic-flightdeck/actions/workflows/ci.yml/badge.svg)](https://github.com/mizcausevic-dev/kinetic-flightdeck/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/node-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-66FCF1)](LICENSE)

Synthetic API and read-only preview for exploring how **MCP server posture**, **governance decisions**, and **agent fleet observability** could be combined for an operator. All entities, incidents, costs, and scores in this repository are illustrative fixtures.

## Why This Exists

Teams operating multiple MCP servers and agent fleets need a coherent way to review posture, incidents, and ownership. Flightdeck demonstrates a possible operator view using checked-in sample data. It does not yet connect to the three upstream services.

This repo is the third pillar in a trilogy:

| Repo | Layer | Question it answers |
|---|---|---|
| [`mcp-sentinel`](https://github.com/mizcausevic-dev/mcp-sentinel) | Tool surface | *What MCP tools are exposed and how risky are they?* |
| [`agent-codex`](https://github.com/mizcausevic-dev/agent-codex) | Control plane | *Under what policies are decisions allowed?* |
| [`agentobserve`](https://github.com/mizcausevic-dev/agentobserve) | Runtime | *What did agents actually do — cost, latency, outcomes?* |
| **`kinetic-flightdeck`** | **Operator surface** | ***Are we OK right now? Who do I call?*** |

## Project Overview

| Attribute | Detail |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express 5 |
| Domain | AI Platform Engineering operator console |
| Aggregation Areas | Illustrative composite posture · Fixture incidents · Risk matrix · Owner accountability · Timeline |
| Operational Outputs | Fleet posture summary · Risk matrix · Top-risk entities · Team scorecards · Monday-morning headline |

## Operator Console Preview

![Flightdeck local API preview with a visible synthetic-demo banner, fixture KPIs, risk matrix, incident feed, and owner scorecards](docs/hero.png)

This screenshot was captured from `http://127.0.0.1:3000/preview/` with the local API running. The page fetches the API's checked-in fixtures; it does not display production telemetry. [Phone preview](docs/mobile.png).

## Composite Score Methodology

The prototype computes a weighted composite from invented fixture scores. The weights are design choices for this demo, not validated risk or compliance methodology:

| Pillar | Weight | Reasoning |
|---|---|---|
| Security (mcp-sentinel) | 0.45 | A security incident dominates other concerns |
| Governance (agent-codex) | 0.30 | Gives sample policy signals meaningful weight |
| Operations (agentobserve) | 0.25 | Degradation is recoverable; breach is not |

Selected signals (security score < 50, multiple SLA breaches, or > 20% budget overrun) override the composite and force a `critical` or `degraded` demo status. These labels are triage cues for fixtures, not regulatory findings.

## Architecture

```
checked-in fleet and incident fixtures ──► aggregators ──► /api/flightdeck/* ──► /preview/
```

There is no upstream polling, persistence, authentication, or production deployment configuration. The API binds to `127.0.0.1` by default and returns `X-Data-Mode: synthetic-demo`. Do not expose it on a public interface or use its scores for operational or compliance decisions.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Service status and synthetic-data disclosure |
| GET | `/preview/` | Read-only UI populated by the local API |
| GET | `/api/flightdeck/summary` | Monday-morning operator headline (top-3 risks, attention-needed teams, KPIs) |
| GET | `/api/flightdeck/posture` | Full fleet rollup with summary + per-entity scores |
| GET | `/api/flightdeck/posture/:entityId` | Single entity composite posture |
| GET | `/api/flightdeck/incidents` | Unified incident feed; filters: `source`, `severity`, `status`, `entityId` |
| GET | `/api/flightdeck/timeline?hours=N` | Fixture incidents detected within the last 1–168 hours, newest first; historical fixtures currently return an empty window |
| GET | `/api/flightdeck/risk-matrix` | N×M matrix of entities × risk dimensions |
| GET | `/api/flightdeck/owners` | Team scorecards sorted by attention-needed |

## Sample Output: `/api/flightdeck/summary`

```json
{
  "generatedAt": "<request-time ISO 8601>",
  "dataMode": "synthetic-demo",
  "headline": {
    "totalEntities": 7,
    "productionAtRisk": 2,
    "averageComposite": 77,
    "openIncidents": 4,
    "criticalIncidents": 1,
    "teamsNeedingAttention": 2
  },
  "topRiskEntities": [
    {
      "entityId": "srv_internal_crm",
      "name": "Internal CRM Bridge",
      "composite": { "overall": 46, "security": 35, "governance": 48, "operations": 62 },
      "status": "critical",
      "recommendedNextAction": "Quarantine entity; engage SecOps + platform on-call; suspend production traffic."
    }
  ],
  "teamsNeedingAttention": [
    {
      "ownerTeam": "revops",
      "ownedEntities": 1,
      "openIncidents": 3,
      "monthlyCostUsd": 555,
      "status": "attention-needed"
    }
  ]
}
```

## Sample Output: Risk Matrix Cell

```json
{
  "entityId": "srv_internal_crm",
  "dimension": "cost",
  "level": "red",
  "rationale": "Cost 123% of budget — material overrun."
}
```

## Status Decision Logic

| Status | Trigger |
|---|---|
| `critical` | Security < 50, OR ≥ 2 open security incidents, OR composite < 55 in production |
| `degraded` | ≥ 3 SLA breaches, OR cost > 1.2× budget, OR composite < 70 |
| `review` | Any open incident, OR composite < 85 |
| `healthy` | Composite ≥ 85 with zero open signals |

## Getting Started

### Prerequisites
- Node.js 20+
- npm

### Setup

```bash
git clone https://github.com/mizcausevic-dev/kinetic-flightdeck.git
cd kinetic-flightdeck
npm ci
npm run dev
```

Visit:
- `http://localhost:3000/health`
- `http://localhost:3000/api/flightdeck/summary`
- `http://localhost:3000/api/flightdeck/risk-matrix`
- `http://localhost:3000/preview/`

### Run Tests

```bash
npm test
```

The test suite covers posture aggregation, incident filtering, risk matrix, owner-team scorecards, and HTTP validation.

## What This Demonstrates

- A possible unified operator view of three pillar concepts using sample data
- Composite scoring that respects platform-engineering doctrine (security dominates)
- Override logic — single critical signals override good composites (the "90 + critical = critical" rule)
- N×M risk matrix as a CISO-readable view across entities and dimensions
- Owner-team accountability rollup mapped to incident exposure
- A TypeScript API with strict mode and CI on Node 20 + 22; production integrations and authorization remain future work

## Future Enhancements

- Live polling of mcp-sentinel, agent-codex, and agentobserve over their public APIs
- WebSocket push for real-time incident updates
- PagerDuty/Slack/SIEM webhook adapters for the unified incident feed
- Persistent posture history with PostgreSQL + Grafana panels
- Multi-tenant control plane for managed-service deployment
- Embedded React dashboard with cross-pillar drill-down

## Tech Stack

- Node.js, TypeScript, Express, Zod
- Helmet
- Node test runner

## Portfolio Links

- [LinkedIn](https://www.linkedin.com/in/mizcausevic/)
- [Skills Page](https://mizcausevic.com/skills)
- [Medium](https://medium.com/@mizcausevic)
- [GitHub](https://github.com/mizcausevic-dev)

Part of [mizcausevic-dev's GitHub portfolio](https://github.com/mizcausevic-dev) — AI Platform Engineering trilogy capstone.

---

**Connect:** [LinkedIn](https://www.linkedin.com/in/mirzacausevic/) · [Kinetic Gain](https://kineticgain.com) · [Medium](https://medium.com/@mizcausevic/) · [Skills](https://mizcausevic.com/skills/)
