import {
  compareLatencyToBaseline,
  compareRatioToBaseline,
  evaluateLatencyGuardrail,
  evaluateRatioGuardrail,
  evaluateSslGuardrail,
} from './httpHealthPolicy';

describe('HTTP health policy', () => {
  it.each([
    [0.995, 'healthy'],
    [0.99, 'degraded'],
    [0.9899, 'unhealthy'],
    [null, 'unknown'],
    [Number.NaN, 'unknown'],
  ])('classifies ratio %p as %s', (value, state) => {
    expect(evaluateRatioGuardrail(value).state).toBe(state);
  });

  it.each([
    [0.999, 'healthy'],
    [1, 'degraded'],
    [1.999, 'degraded'],
    [2, 'unhealthy'],
    [null, 'unknown'],
    [Number.NaN, 'unknown'],
  ])('classifies latency %p as %s', (value, state) => {
    expect(evaluateLatencyGuardrail(value).state).toBe(state);
  });

  it.each([
    [28 * 86_400, 'healthy'],
    [7 * 86_400, 'degraded'],
    [7 * 86_400 - 1, 'unhealthy'],
    [null, 'unknown'],
    [Number.NaN, 'unknown'],
  ])('classifies SSL seconds %p as %s', (value, state) => {
    expect(evaluateSslGuardrail(value).state).toBe(state);
  });

  it('uses an absolute ratio floor when the historical MAD is zero', () => {
    expect(compareRatioToBaseline(0.996, { median: 1, mad: 0 }).state).toBe('healthy');
    expect(compareRatioToBaseline(0.994, { median: 1, mad: 0 }).state).toBe('degraded');
    expect(compareRatioToBaseline(0.989, { median: 1, mad: 0 }).state).toBe('unhealthy');
  });

  it('uses proportional and absolute latency floors', () => {
    expect(compareLatencyToBaseline(0.14, { median: 0.1, mad: 0 }).state).toBe('healthy');
    expect(compareLatencyToBaseline(0.16, { median: 0.1, mad: 0 }).state).toBe('degraded');
    expect(compareLatencyToBaseline(0.4, { median: 0.1, mad: 0 }).state).toBe('unhealthy');
  });

  it('uses MAD when normal behaviour is naturally variable', () => {
    expect(compareRatioToBaseline(0.96, { median: 1, mad: 0.02 }).state).toBe('healthy');
    expect(compareRatioToBaseline(0.93, { median: 1, mad: 0.02 }).state).toBe('degraded');
    expect(compareRatioToBaseline(0.87, { median: 1, mad: 0.02 }).state).toBe('unhealthy');

    expect(compareLatencyToBaseline(0.7, { median: 0.2, mad: 0.1 }).state).toBe('degraded');
    expect(compareLatencyToBaseline(0.9, { median: 0.2, mad: 0.1 }).state).toBe('unhealthy');
  });
});
