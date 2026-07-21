import { DashboardQuerySemanticValues } from './types';

import { formatProbeMatcher, interpolateTargets } from './interpolate';

const semanticValues: DashboardQuerySemanticValues = {
  job: 'example-job',
  instance: 'https://example.com',
  probes: ['frankfurt', 'ohio'],
  rangeSeconds: 3600,
  interval: '30s',
  intervalMs: 30_000,
  rateInterval: '1m',
};

describe('interpolateTargets', () => {
  it('interpolates dashboard query macros', () => {
    const [target] = interpolateTargets(
      [
        {
          refId: 'A',
          expr: 'sum by(probe)(rate(metric{job="$job", instance="$instance", probe=~"$probe"}[$__rate_interval]))',
        },
      ],
      semanticValues
    );

    expect(target.expr).toBe(
      'sum by(probe)(rate(metric{job="example-job", instance="https://example.com", probe=~"frankfurt|ohio"}[1m]))'
    );
  });

  it('uses an all-probes matcher when no probes are selected', () => {
    expect(formatProbeMatcher([])).toBe('.*');
  });

  it('escapes regex characters in probe names', () => {
    expect(formatProbeMatcher(['probe.us-east'])).toBe('probe\\.us-east');
  });
});
