import { ReliabilitySuggestion } from './types';
import { CheckType } from 'types';

import {
  getProposedHttpCheckDraft,
  isInitialReviewCandidate,
  parseSuggestedCheckConfig,
  suggestionToCheckDraft,
  toReliabilityOpportunity,
} from './model';

const HTTP_SUGGESTION: ReliabilitySuggestion = {
  id: 'http-suggestion',
  target: 'https://mcp.goagain.dev/',
  checkType: 'http',
  evidence: {
    reqPerS: 1.6081232492997197,
    p99Ms: 4,
    statusDistribution: {
      '200': 1.6058823529411763,
      '400': 0.002240896358543417,
    },
    families: ['http_server_request_duration_seconds_bucket'],
    activitySemantics: ['bytes'],
  },
  evidencePrototype: {
    kind: 'graft-demo-v1',
    window: {
      label: 'the last 24 hours',
      from: 1_784_800_800_000,
      to: 1_784_887_200_000,
    },
    exactRequestTotal: 14_700,
    timeline: [
      { timestamp: 1_784_800_800_000, requests: 5100 },
      { timestamp: 1_784_804_400_000, requests: 4900 },
      { timestamp: 1_784_808_000_000, requests: 4700 },
    ],
  },
  reachability: 'public',
  reachabilitySource: 'service_dns_hint',
  confidence: 'high',
  score: 1.416328110536119,
  dedupStatus: 'uncovered',
  authRequired: false,
  algorithms: ['score', 'llm_rank'],
  relevance: 75,
  angles: ['functional_criticality', 'customer_facing', 'high_traffic'],
  purpose: 'api',
  rationale: 'Public endpoint with steady traffic serving likely critical MCP protocol functions.',
  proposedCheck: {
    job: 'mcp.goagain.dev',
    frequencyMs: 60_000,
    timeoutMs: 2000,
    validStatusCodes: [200],
    failIfNotSSL: true,
    probeIds: [7],
    locationPolicy: 'Run from the suggested public probe in Frankfurt.',
  },
  prompt:
    'Create a Grafana Synthetic Monitoring http check for https://mcp.goagain.dev/. Suggested configuration: job "mcp.goagain.dev", frequency 1m0s, timeout 2s, expect HTTP status [200], fail if not SSL, probe IDs [7]. Why: Public endpoint with steady traffic serving likely critical MCP protocol functions.; the endpoint served 1.6 req/s (0.00% errors) over the last hour.',
};

const DNS_SUGGESTION: ReliabilitySuggestion = {
  id: 'dns-suggestion',
  target: 'host.docker.internal',
  checkType: 'dns',
  evidence: {
    reqPerS: 1.2870056497175142,
    p99Ms: 4,
    statusDistribution: { '200': 1.2870056497175142, '400': 0 },
    families: ['http_server_request_duration_seconds_bucket'],
    activitySemantics: ['bytes'],
  },
  reachability: 'nxdomain',
  reachabilitySource: 'service_dns_hint',
  confidence: 'high',
  score: 1.3592672374699362,
  dedupStatus: 'uncovered',
  authRequired: false,
  needsConfiguration: true,
  configurationReason: 'private zone: configure the internal resolver and assign a private probe',
  algorithms: ['score'],
  angles: [],
  prompt:
    'Create a Grafana Synthetic Monitoring dns check for host.docker.internal. Why: the endpoint served 1.3 req/s over the last hour.',
};

describe('Reliability Inbox model', () => {
  it('parses the structured check configuration embedded in the prototype prompt', () => {
    expect(parseSuggestedCheckConfig(HTTP_SUGGESTION.prompt)).toEqual({
      job: 'mcp.goagain.dev',
      frequencyMs: 60_000,
      timeoutMs: 2000,
      validStatusCodes: [200],
      failIfNotSSL: true,
      probeIds: [7],
    });
  });

  it('builds an HTTP draft and keeps only probes that exist on the active stack', () => {
    const availableDraft = suggestionToCheckDraft(HTTP_SUGGESTION, [7]);
    const unavailableDraft = suggestionToCheckDraft(HTTP_SUGGESTION, [12]);

    expect(availableDraft.probes).toEqual([7]);
    expect(unavailableDraft.probes).toEqual([]);
    expect(availableDraft.frequency).toBe(60_000);
    expect(availableDraft.timeout).toBe(2000);
    expect(availableDraft.settings).toEqual(
      expect.objectContaining({
        http: expect.objectContaining({
          validStatusCodes: [200],
          failIfNotSSL: true,
        }),
      })
    );
  });

  it('keeps a private DNS draft invalid until the user supplies a resolver and probe', () => {
    const draft = suggestionToCheckDraft(DNS_SUGGESTION, [7]);

    expect(draft.probes).toEqual([]);
    expect(draft.settings).toEqual(
      expect.objectContaining({
        dns: expect.objectContaining({
          server: '',
        }),
      })
    );
  });

  it('derives user-facing evidence from structured telemetry instead of trusting prompt copy', () => {
    const opportunity = toReliabilityOpportunity(HTTP_SUGGESTION);

    expect(opportunity.errorRate).toBe('0.14%');
    expect(opportunity.requestVolume).toBe('5.8k');
    expect(opportunity.evidencePrototype).toEqual(HTTP_SUGGESTION.evidencePrototype);
    expect(opportunity.estimatedUsage).toBe('Estimated usage: 43.2k executions / month');
    expect(opportunity.readiness).toBe('ready');
    expect(opportunity.suggestion.checkType).toBe(CheckType.Http);
    expect(opportunity.proposedCheck).toEqual(
      expect.objectContaining({
        target: 'https://mcp.goagain.dev/',
        checkType: 'http',
        method: 'GET',
        validStatusCodes: [200],
        locationPolicy: 'Run from the suggested public probe in Frankfurt.',
        estimatedExecutionsPerMonth: 43_200,
      })
    );
  });

  it('uses hostname, non-default port, and meaningful path as the human-readable endpoint identity', () => {
    const target = 'https://api.example.com:8443/health?verbose=true#status';
    const opportunity = toReliabilityOpportunity({ ...HTTP_SUGGESTION, target });

    expect(opportunity.subject).toBe('api.example.com:8443/health');
    expect(opportunity.proposedCheck.target).toBe(target);
  });

  it('builds the proposal deterministically before Assistant is involved', () => {
    expect(getProposedHttpCheckDraft(HTTP_SUGGESTION)).toEqual(
      expect.objectContaining({
        job: 'mcp.goagain.dev',
        frequencyMs: 60_000,
        timeoutMs: 2000,
        validStatusCodes: [200],
        probeIds: [7],
      })
    );
  });

  it('suppresses private DNS and development-only targets from the initial queue', () => {
    const developmentHttp = {
      ...HTTP_SUGGESTION,
      id: 'development-http',
      target: 'http://host.docker.internal:3000/ready',
    };

    expect(isInitialReviewCandidate(HTTP_SUGGESTION)).toBe(true);
    expect(isInitialReviewCandidate(DNS_SUGGESTION)).toBe(false);
    expect(isInitialReviewCandidate(developmentHttp)).toBe(false);
  });
});
