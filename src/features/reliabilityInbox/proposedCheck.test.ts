import { HTTP_RELIABILITY_SUGGESTION } from 'test/fixtures/reliabilityInbox';

import { getProposedHttpCheckDraft, parseSuggestedHttpCheckConfig } from './proposedCheck';

describe('proposed HTTP check', () => {
  it('parses structured configuration from the suggestion prompt', () => {
    expect(parseSuggestedHttpCheckConfig(HTTP_RELIABILITY_SUGGESTION.prompt)).toEqual({
      job: 'mcp.goagain.dev',
      frequencyMs: 60_000,
      timeoutMs: 2000,
      validStatusCodes: [200],
      failIfNotSSL: true,
      probeIds: [7],
    });
  });

  it('defers probe selection when the suggestion does not specify probes', () => {
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
});
