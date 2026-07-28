import { reliabilitySuggestionsSchema } from './types';

const PARTIAL_HTTP_SUGGESTION = {
  id: 'partial-http',
  target: 'https://example.com/',
  checkType: 'http',
  evidence: {
    families: ['traces_service_graph_request_total'],
    activitySemantics: [],
  },
  reachability: 'public',
  reachabilitySource: 'service_dns_hint',
  confidence: 'low',
  score: 1,
  dedupStatus: 'uncovered',
  authRequired: false,
  algorithms: ['score'],
  prompt: 'Create an HTTP check for https://example.com/.',
};

describe('Reliability Inbox suggestion contract', () => {
  it('accepts an HTTP suggestion with partial aggregate evidence', () => {
    const result = reliabilitySuggestionsSchema.parse({
      suggestions: [PARTIAL_HTTP_SUGGESTION],
    });

    expect(result.suggestions[0].evidence).toEqual({
      families: ['traces_service_graph_request_total'],
      activitySemantics: [],
    });
  });

  it('does not broaden the contract to multihttp suggestions', () => {
    expect(() =>
      reliabilitySuggestionsSchema.parse({
        suggestions: [{ ...PARTIAL_HTTP_SUGGESTION, checkType: 'multihttp' }],
      })
    ).toThrow();
  });

  it('accepts an optional confidence breakdown without requiring it from legacy suggestions', () => {
    const result = reliabilitySuggestionsSchema.parse({
      suggestions: [
        {
          ...PARTIAL_HTTP_SUGGESTION,
          confidenceBreakdown: {
            observation: {
              level: 'high',
              reason: 'Traffic evidence is consistent.',
            },
            coverageGap: {
              level: 'medium',
              reason: 'Indirect coverage may exist.',
            },
            recommendation: {
              level: 'medium',
            },
          },
        },
        PARTIAL_HTTP_SUGGESTION,
      ],
    });

    expect(result.suggestions[0].confidenceBreakdown?.coverageGap?.level).toBe('medium');
    expect(result.suggestions[1].confidenceBreakdown).toBeUndefined();
  });

  it('rejects unsupported confidence-breakdown levels', () => {
    expect(() =>
      reliabilitySuggestionsSchema.parse({
        suggestions: [
          {
            ...PARTIAL_HTTP_SUGGESTION,
            confidenceBreakdown: {
              recommendation: {
                level: 'certain',
              },
            },
          },
        ],
      })
    ).toThrow();
  });
});
