import { ApiEntry } from './types';
import { ReliabilitySuggestion } from 'features/reliabilityInbox/types';

const BASE_SUGGESTION: ReliabilitySuggestion = {
  id: 'reliability-inbox-prometheus',
  target: 'https://prometheus.datasource.grafana.app/',
  checkType: 'http',
  evidence: {
    reqPerS: 332.5,
    p99Ms: 280,
    statusDistribution: {
      '200': 331.8,
      '500': 0.7,
    },
    families: ['traces_service_graph_request_total'],
    activitySemantics: [],
  },
  reachability: 'public',
  reachabilitySource: 'service_dns_hint',
  confidence: 'high',
  score: 1.4,
  dedupStatus: 'uncovered',
  authRequired: false,
  algorithms: ['score', 'exact_url_match'],
  relevance: 88,
  angles: ['customer_facing'],
  rationale:
    'Customer-facing Grafana datasource queries depend on this endpoint. An external check could detect availability failures before users report them.',
  proposedCheck: {
    job: 'prometheus.datasource.grafana.app',
    frequencyMs: 60_000,
    timeoutMs: 3000,
    validStatusCodes: [200],
    failIfNotSSL: true,
    probeIds: [7],
    locationPolicy: 'Run from the suggested public probe in Frankfurt.',
  },
  prompt:
    'Create a Grafana Synthetic Monitoring http check for https://prometheus.datasource.grafana.app/. Suggested configuration: job "prometheus.datasource.grafana.app", frequency 1m0s, timeout 3s, expect HTTP status [200], fail if not SSL, probe IDs [7].',
};

const suggestions: ReliabilitySuggestion[] = [
  BASE_SUGGESTION,
  {
    ...BASE_SUGGESTION,
    id: 'reliability-inbox-app-platform-eu',
    target: 'https://app-platform-apiserver-dev-eu-west.grafana.app/ready',
    evidence: {
      ...BASE_SUGGESTION.evidence,
      reqPerS: 10.8,
    },
    relevance: 36,
    rationale:
      'This public application-platform endpoint serves steady traffic and may benefit from independent availability coverage.',
    proposedCheck: {
      ...BASE_SUGGESTION.proposedCheck!,
      job: 'app-platform-apiserver-dev-eu-west.grafana.app',
    },
    prompt:
      'Create a Grafana Synthetic Monitoring http check for https://app-platform-apiserver-dev-eu-west.grafana.app/ready.',
  },
  {
    ...BASE_SUGGESTION,
    id: 'reliability-inbox-features',
    target: 'https://features.grafana.app/',
    evidence: {
      ...BASE_SUGGESTION.evidence,
      reqPerS: 191.6,
    },
    relevance: 80,
    rationale:
      'Feature delivery can affect several customer-facing capabilities, so a failed endpoint could have broad downstream impact.',
    proposedCheck: {
      ...BASE_SUGGESTION.proposedCheck!,
      job: 'features.grafana.app',
    },
    prompt: 'Create a Grafana Synthetic Monitoring http check for https://features.grafana.app/.',
  },
  {
    ...BASE_SUGGESTION,
    id: 'reliability-inbox-partial-evidence',
    target: 'https://api.example.com/health',
    evidence: {
      families: ['traces_service_graph_request_total'],
      activitySemantics: [],
    },
    confidence: 'low',
    relevance: 48,
    rationale:
      'The endpoint appears publicly reachable, but detailed traffic measurements are unavailable and the recommendation needs validation.',
    proposedCheck: {
      ...BASE_SUGGESTION.proposedCheck!,
      job: 'api.example.com',
    },
    prompt: 'Create a Grafana Synthetic Monitoring http check for https://api.example.com/health.',
  },
];

export const listReliabilityInboxSuggestions: ApiEntry = {
  route: '/api/plugins/grafana-synthetic-monitoring-app/resources/reliability-inbox/suggestions',
  method: 'get',
  result: () => ({
    json: {
      suggestions,
    },
  }),
};
