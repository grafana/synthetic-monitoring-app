import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { Check } from 'types';

import { getUpStateByCheckQuery } from './upStateByCheck';

function makeCheck(frequencyMs: number): Check {
  return { ...BASIC_HTTP_CHECK, frequency: frequencyMs };
}

describe(`getUpStateByCheckQuery`, () => {
  it(`reads the latest execution result rather than a rate ratio`, () => {
    const { expr } = getUpStateByCheckQuery({ checks: [makeCheck(60_000)] });

    // A ratio of rates can evaluate to 0/0 (NaN) between executions of
    // low-frequency checks, which read as "down" without any failure.
    expect(expr).toContain(`last_over_time(probe_success`);
    expect(expr).not.toContain(`rate(`);
  });

  it(`sizes the window to contain the slowest check's most recent sample, but no wider`, () => {
    const { expr } = getUpStateByCheckQuery({ checks: [makeCheck(60_000), makeCheck(3_600_000)] });

    // 1.5x the slowest frequency: wide enough for an active probe's latest
    // sample, narrow enough that a dead probe's stale success drops out fast.
    expect(expr).toContain(`[5400s]`);
  });

  it(`keeps a floor window for fast or unknown frequencies`, () => {
    expect(getUpStateByCheckQuery({ checks: [makeCheck(60_000)] }).expr).toContain(`[300s]`);
    expect(getUpStateByCheckQuery().expr).toContain(`[300s]`);
  });
});
