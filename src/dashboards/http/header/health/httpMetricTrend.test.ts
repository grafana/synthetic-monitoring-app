import {
  getHttpTrendMaterialDelta,
  type HttpTrendInterpretationInput,
  interpretHttpMetricTrend,
} from './httpMetricTrend';

function interpret(overrides: Partial<HttpTrendInterpretationInput> = {}) {
  return interpretHttpMetricTrend({
    metricId: 'average-latency',
    shape: 'stable',
    evaluationState: 'healthy',
    rangeState: 'healthy',
    source: 'guardrail',
    rangeMode: 'live',
    ...overrides,
  }).label;
}

describe('interpretHttpMetricTrend', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('describes healthy stable reachability as consistently reachable', () => {
    expect(
      interpret({
        metricId: 'reachability',
        rangeValue: 1,
      })
    ).toBe('Consistently reachable');
  });

  it('does not describe a persistent alerted outage as steady', () => {
    expect(
      interpret({
        metricId: 'reachability',
        evaluationState: 'unhealthy',
        rangeState: 'unhealthy',
        source: 'alert',
        alertAtEvaluation: true,
        rangeValue: 0,
      })
    ).toBe('Unavailable throughout this range');
  });

  it('acknowledges improvement without claiming an active alert recovered', () => {
    expect(
      interpret({
        shape: 'falling',
        evaluationState: 'unhealthy',
        rangeState: 'unhealthy',
        source: 'alert',
        alertAtEvaluation: true,
      })
    ).toBe('Improving but still critical');
  });

  it('uses recovered only after an alert resolves and telemetry stabilises', () => {
    expect(
      interpret({
        metricId: 'reachability',
        shape: 'returned',
        rangeState: 'unhealthy',
        source: 'alert',
        alertResolvedInRange: true,
        stabilised: true,
      })
    ).toBe('Recovered earlier in this range');

    expect(
      interpret({
        metricId: 'reachability',
        shape: 'returned',
        evaluationState: 'degraded',
        rangeState: 'unhealthy',
        source: 'alert',
        alertResolvedInRange: true,
        stabilised: false,
      })
    ).toBe('Recovering but still degraded');
  });

  it('uses historical tense for a recovered alert', () => {
    expect(
      interpret({
        metricId: 'reachability',
        shape: 'returned',
        rangeState: 'unhealthy',
        source: 'alert',
        alertResolvedInRange: true,
        stabilised: true,
        rangeMode: 'historical',
      })
    ).toBe('Recovered before the range ended');
  });

  it('uses source-sensitive language without an alert', () => {
    expect(
      interpret({
        shape: 'returned',
        rangeState: 'unhealthy',
        source: 'baseline',
        stabilised: true,
        rangeMode: 'historical',
      })
    ).toBe('Returned to its normal range before the range ended');

    expect(
      interpret({
        shape: 'returned',
        rangeState: 'unhealthy',
        source: 'guardrail',
        stabilised: true,
      })
    ).toBe('Back within the expected range');

    expect(
      interpret({
        shape: 'falling',
        evaluationState: 'unknown',
        rangeState: 'unknown',
        source: 'none',
      })
    ).toBe('Latency decreased across this range');
  });

  it('distinguishes variable from insufficient evidence', () => {
    expect(interpret({ shape: 'variable', rangeState: 'degraded', source: 'baseline' })).toBe(
      'Variable across this range'
    );
    expect(
      interpret({
        shape: 'insufficient',
        evaluationState: 'unknown',
        rangeState: 'unknown',
        source: 'none',
      })
    ).toBe('Trend not established');
  });

  it('retains the direction of a step change', () => {
    expect(
      interpret({
        shape: 'shifted',
        movement: 'rising',
      })
    ).toBe('Shifted higher recently');
    expect(
      interpret({
        metricId: 'reachability',
        shape: 'shifted',
        movement: 'falling',
      })
    ).toBe('Shifted lower recently');
  });

  it('does not call the normal certificate countdown worsening', () => {
    jest.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 6, 23));

    expect(
      interpret({
        metricId: 'ssl-expiry',
        shape: 'falling',
        rangeValue: 61 * 86_400,
      })
    ).toBe('On track for renewal · expires 2026-09-22');

    expect(
      interpret({
        metricId: 'ssl-expiry',
        shape: 'rising',
        rangeValue: 89 * 86_400,
      })
    ).toBe('Renewed during this range');
  });

  it('describes past-expiry certificates as expired on a date', () => {
    jest.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 6, 23));

    expect(
      interpret({
        metricId: 'ssl-expiry',
        evaluationState: 'unhealthy',
        rangeState: 'unhealthy',
        rangeValue: -20,
      })
    ).toBe('Expired on 2026-07-22');
  });

  it('folds the expiry date into approaching and overdue banners', () => {
    jest.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 6, 23));

    expect(
      interpret({
        metricId: 'ssl-expiry',
        evaluationState: 'degraded',
        rangeValue: 14 * 86_400,
      })
    ).toBe('Approaching expiry threshold · expires 2026-08-06');

    expect(
      interpret({
        metricId: 'ssl-expiry',
        evaluationState: 'unhealthy',
        rangeValue: 3 * 86_400,
      })
    ).toBe('Renewal overdue · expires 2026-07-26');
  });
});

describe('getHttpTrendMaterialDelta', () => {
  it('uses absolute floors for ratio, latency, and certificate metrics', () => {
    expect(getHttpTrendMaterialDelta('reachability', { median: 1, mad: 0 })).toBe(0.005);
    expect(getHttpTrendMaterialDelta('average-latency', { median: 0.2, mad: 0 })).toBe(0.05);
    expect(getHttpTrendMaterialDelta('ssl-expiry')).toBe(86_400);
  });

  it('scales materiality with learned variation', () => {
    expect(getHttpTrendMaterialDelta('reachability', { median: 0.999, mad: 0.01 })).toBe(0.03);
    expect(getHttpTrendMaterialDelta('average-latency', { median: 2, mad: 0.2 })).toBeCloseTo(0.6);
  });
});
