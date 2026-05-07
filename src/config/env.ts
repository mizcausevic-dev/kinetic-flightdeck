import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mcpSentinelUrl: process.env.MCP_SENTINEL_URL || 'http://localhost:3001',
  agentCodexUrl: process.env.AGENT_CODEX_URL || 'http://localhost:3002',
  agentObserveUrl: process.env.AGENT_OBSERVE_URL || 'http://localhost:3003',
};
