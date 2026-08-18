import { HTTP_RELIABILITY_SUGGESTION } from 'test/fixtures/reliabilityInbox';

import { ReliabilitySuggestion, reliabilitySuggestionSchema } from './types';
import { CheckType } from 'types';

import {
  compareReliabilityOpportunities,
  getProposedHttpCheckDraft,
  isInitialReviewCandidate,
  parseSuggestedCheckConfig,
  toReliabilityOpportunity,
} from './model';

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
    expect(parseSuggestedCheckConfig(HTTP_RELIABILITY_SUGGESTION.prompt)).toEqual({
      job: 'mcp.goagain.dev',
      frequencyMs: 60_000,
      timeoutMs: 2000,
      validStatusCodes: [200],
      failIfNotSSL: true,
      probeIds: [7],
    });
  });

  it('derives user-facing evidence from structured telemetry instead of trusting prompt copy', () => {
    const opportunity = toReliabilityOpportunity(HTTP_RELIABILITY_SUGGESTION);

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
      ...HTTP_RELIABILITY_SUGGESTION,
      evidence: {
        families: HTTP_RELIABILITY_SUGGESTION.evidence.families,
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

  it('orders reviewable recommendations by technical relevance', () => {
    const opportunities = [
      { id: 'lower-technical-relevance', relevance: 20 },
      { id: 'higher-technical-relevance', relevance: 75 },
    ]
      .map(({ id, relevance }) =>
        toReliabilityOpportunity({
          ...HTTP_RELIABILITY_SUGGESTION,
          id,
          target: `https://${id}.example.com/`,
          relevance,
        })
      )
      .sort(compareReliabilityOpportunities);

    expect(opportunities.map(({ id }) => id)).toEqual(['higher-technical-relevance', 'lower-technical-relevance']);
  });

  it('falls back to the service score when technical relevance is unavailable', () => {
    const opportunities = [
      { id: 'lower-service-score', score: 0.2 },
      { id: 'higher-service-score', score: 0.8 },
    ]
      .map(({ id, score }) =>
        toReliabilityOpportunity({
          ...HTTP_RELIABILITY_SUGGESTION,
          id,
          score,
          relevance: undefined,
          target: `https://${id}.example.com/`,
        })
      )
      .sort(compareReliabilityOpportunities);

    expect(opportunities.map(({ id }) => id)).toEqual(['higher-service-score', 'lower-service-score']);
  });

  it('uses hostname, non-default port, and meaningful path as the human-readable endpoint identity', () => {
    const target = 'https://api.example.com:8443/health?verbose=true#status';
    const opportunity = toReliabilityOpportunity({ ...HTTP_RELIABILITY_SUGGESTION, target });

    expect(opportunity.subject).toBe('api.example.com:8443/health');
    expect(opportunity.proposedCheck.target).toBe(target);
  });

  it('defers probe location selection to review when the suggestion does not specify probes', () => {
    const draft = getProposedHttpCheckDraft({
      ...HTTP_RELIABILITY_SUGGESTION,
      prompt:
        'Create a Grafana Synthetic Monitoring http check for https://mcp.goagain.dev/. Suggested configuration: job "mcp.goagain.dev", frequency 1m0s, timeout 2s, expect HTTP status [200], fail if not SSL, probe IDs [].',
    });

    expect(draft).toEqual(
      expect.objectContaining({
        probeIds: [],
        locationPolicy: 'Probe locations will be selected during review.',
      })
    );
  });

  it.each([
    'http://localhost/',
    'http://service.localhost/',
    'http://service.local/',
    'http://service.internal/',
    'http://service.test/',
    'http://host.docker.internal:3000/ready',
    'http://10.0.0.1/',
    'http://127.0.0.1/',
    'http://169.254.0.1/',
    'http://0.1.2.3/',
    'http://[::]/',
    'http://[::1]/',
    'http://[fc00::1]/',
    'http://[fe80::1]/',
  ])('suppresses private and development-only target %s from the initial queue', (target) => {
    expect(isInitialReviewCandidate({ ...HTTP_RELIABILITY_SUGGESTION, target })).toBe(false);
  });

  it('keeps public IPv4 and IPv6 targets in the initial queue', () => {
    expect(isInitialReviewCandidate(HTTP_RELIABILITY_SUGGESTION)).toBe(true);
    expect(isInitialReviewCandidate({ ...HTTP_RELIABILITY_SUGGESTION, target: 'http://8.8.8.8/' })).toBe(true);
    expect(
      isInitialReviewCandidate({ ...HTTP_RELIABILITY_SUGGESTION, target: 'http://[2606:4700:4700::1111]/' })
    ).toBe(true);
    expect(isInitialReviewCandidate(DNS_SUGGESTION)).toBe(false);
  });

  it('suppresses suggestions the service no longer considers uncovered', () => {
    expect(isInitialReviewCandidate({ ...HTTP_RELIABILITY_SUGGESTION, dedupStatus: 'covered' })).toBe(false);
    expect(isInitialReviewCandidate({ ...HTTP_RELIABILITY_SUGGESTION, dedupStatus: 'dismissed' })).toBe(false);
  });

  it('suppresses coverage gaps without high confidence', () => {
    expect(isInitialReviewCandidate({ ...HTTP_RELIABILITY_SUGGESTION, confidence: 'medium' })).toBe(false);
    expect(isInitialReviewCandidate({ ...HTTP_RELIABILITY_SUGGESTION, confidence: 'low' })).toBe(false);
  });
});
