import { ReliabilitySuggestion, reliabilitySuggestionSchema } from './types';
import { CheckType } from 'types';

import {
  compareReliabilityOpportunities,
  getProposedHttpCheckDraft,
  isInitialReviewCandidate,
  parseSuggestedCheckConfig,
  toReliabilityOpportunity,
} from './model';

const HTTP_SUGGESTION: ReliabilitySuggestion = {
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
  },
  reachability: 'nxdomain',
  reachabilitySource: 'service_dns_hint',
  confidence: 'high',
  score: 1.3592672374699362,
  dedupStatus: 'uncovered',
  authRequired: false,
  needsConfiguration: true,
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

  it('derives user-facing evidence from structured telemetry instead of trusting prompt copy', () => {
    const opportunity = toReliabilityOpportunity(HTTP_SUGGESTION);

    expect(opportunity.errorRate).toBe('0.14%');
    expect(opportunity.requestVolume).toBe('5.8k');
    expect(opportunity.suggestion.checkType).toBe(CheckType.Http);
    expect(opportunity.proposedCheck).toEqual(
      expect.objectContaining({
        target: 'https://mcp.goagain.dev/',
        checkType: 'http',
        method: 'GET',
        validStatusCodes: [200],
        locationPolicy: 'Run from the configured public probe with ID 7.',
      })
    );
  });

  it('preserves absent numeric evidence instead of presenting it as zero', () => {
    const suggestion = reliabilitySuggestionSchema.parse({
      ...HTTP_SUGGESTION,
      evidence: {
        families: HTTP_SUGGESTION.evidence.families,
      },
    });

    expect(toReliabilityOpportunity(suggestion)).toEqual(
      expect.objectContaining({
        requestVolume: undefined,
        requestRate: undefined,
        errorRate: undefined,
        p99: undefined,
      })
    );
  });

  it('prioritizes confidence, then value, before the raw suggestion score', () => {
    const opportunities = [
      { id: 'high-value-low-confidence', relevance: 99, confidence: 'low' },
      { id: 'lower-value-high-confidence', relevance: 20, confidence: 'high' },
      { id: 'high-value-medium-confidence', relevance: 95, confidence: 'medium' },
      { id: 'medium-value-high-confidence', relevance: 55, confidence: 'high' },
      { id: 'high-value-high-confidence', relevance: 75, confidence: 'high' },
    ]
      .map(({ id, relevance, confidence }) =>
        toReliabilityOpportunity({
          ...HTTP_SUGGESTION,
          id,
          target: `https://${id}.example.com/`,
          relevance,
          confidence,
        })
      )
      .sort(compareReliabilityOpportunities);

    expect(opportunities.map(({ id }) => id)).toEqual([
      'high-value-high-confidence',
      'medium-value-high-confidence',
      'lower-value-high-confidence',
      'high-value-medium-confidence',
      'high-value-low-confidence',
    ]);
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

  it('suppresses suggestions the service no longer considers uncovered', () => {
    expect(isInitialReviewCandidate({ ...HTTP_SUGGESTION, dedupStatus: 'covered' })).toBe(false);
    expect(isInitialReviewCandidate({ ...HTTP_SUGGESTION, dedupStatus: 'dismissed' })).toBe(false);
  });
});
