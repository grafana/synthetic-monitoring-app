import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { Check } from 'types';

import { getLatencyTrendByCheckQuery } from './latencyTrendByCheck';

function makeChecks(count: number): Check[] {
  return Array.from({ length: count }, (_, index) => ({
    ...BASIC_HTTP_CHECK,
    job: `job-${index}`,
    target: `https://target-${index}.example.com`,
  }));
}

describe(`getLatencyTrendByCheckQuery`, () => {
  it(`scopes the query to the given checks`, () => {
    const { expr } = getLatencyTrendByCheckQuery({ checks: makeChecks(3) });

    expect(expr).toContain(`job=~"job-0|job-1|job-2"`);
  });

  it(`falls back to an unscoped query when the matchers would exceed the URL length budget`, () => {
    const { expr } = getLatencyTrendByCheckQuery({ checks: makeChecks(200) });

    expect(expr).not.toContain(`job=~`);
    // The expression still aggregates by check identity.
    expect(expr).toContain(`by (job, instance)`);
  });
});
