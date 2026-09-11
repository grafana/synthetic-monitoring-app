import { DB } from 'test/db';

import { ReliabilitySuggestion } from 'features/reliabilityInbox/types';

export const HTTP_RELIABILITY_SUGGESTION: ReliabilitySuggestion = DB.reliabilitySuggestion.build({
  id: 'http-suggestion',
  target: 'https://mcp.goagain.dev/',
  checkType: 'http',
  evidence: {
    reqPerS: 1.6081232492997197,
    errorRatio: 0.0014,
    p99Ms: 4,
    statusDistribution: {
      '200': 1.6058823529411763,
      '400': 0.002240896358543417,
    },
    families: ['http_server_request_duration_seconds_bucket'],
    provenance: {
      datasource: 'prometheus-uid',
      range: { from: '1784800800000', to: '1784804400000' },
      queries: [{ expr: 'sum(rate(http_server_request_duration_seconds_count[1h]))' }],
    },
  },
  reachability: 'public',
  reachabilitySource: 'service_dns_hint',
  confidence: 'high',
  score: 1.416328110536119,
  dedupStatus: 'uncovered',
  authRequired: false,
  relevance: 75,
  rationale: 'Public endpoint with steady traffic serving likely critical MCP protocol functions.',
  prompt:
    'Create a Grafana Synthetic Monitoring http check for https://mcp.goagain.dev/. Suggested configuration: job "mcp.goagain.dev", frequency 1m0s, timeout 2s, expect HTTP status [200], fail if not SSL, probe IDs [7]. Why: Public endpoint with steady traffic serving likely critical MCP protocol functions.; the endpoint served 1.6 req/s (0.00% errors) over the last hour.',
});
