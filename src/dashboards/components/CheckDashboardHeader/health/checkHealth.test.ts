import { HealthEvidence } from './checkHealth.types';
import { CheckAlertType } from 'types';

import { resolveCheckHealth } from './checkHealth';

const range = { from: 1_000, to: 2_000 };

function evidence({
  id,
  metricId,
  kind,
  state,
  explanationPriority,
}: Pick<HealthEvidence, 'id' | 'metricId' | 'kind' | 'state' | 'explanationPriority'>): HealthEvidence {
  return {
    id,
    metricId,
    kind,
    state,
    summary: id,
    range,
    scope: 'evaluation',
    explanationPriority,
  };
}

function resolveTestHealth(
  args: Omit<Parameters<typeof resolveCheckHealth>[0], 'rangeMode' | 'evaluationAt'> &
    Partial<Pick<Parameters<typeof resolveCheckHealth>[0], 'rangeMode' | 'evaluationAt'>>
) {
  return resolveCheckHealth({
    rangeMode: 'live',
    evaluationAt: range.to,
    ...args,
  });
}

describe('resolveCheckHealth', () => {
  it('lets the worst credible signal win', () => {
    const model = resolveTestHealth({
      metricIds: ['reachability'],
      evidence: [
        evidence({
          id: 'Alert is configured and inactive',
          metricId: 'reachability',
          kind: 'alert',
          state: 'healthy',
          explanationPriority: 400,
        }),
        evidence({
          id: 'Reachability is below normal',
          metricId: 'reachability',
          kind: 'baseline',
          state: 'degraded',
          explanationPriority: 100,
        }),
      ],
    });

    expect(model.state).toBe('degraded');
    expect(model.metrics.reachability.state).toBe('degraded');
    expect(model.compactReasons.map((item) => item.summary)).toEqual(['Reachability is below normal']);
  });

  it('does not let unknown evidence hide known evidence', () => {
    const model = resolveTestHealth({
      metricIds: ['average-latency'],
      evidence: [
        evidence({
          id: 'Baseline unavailable',
          metricId: 'average-latency',
          kind: 'baseline',
          state: 'unknown',
          explanationPriority: 100,
        }),
        evidence({
          id: 'Average latency is under one second',
          metricId: 'average-latency',
          kind: 'guardrail',
          state: 'healthy',
          explanationPriority: 200,
        }),
      ],
      qualifiers: ['Normal not established yet'],
    });

    expect(model.state).toBe('healthy');
    expect(model.qualifiers).toEqual(['Normal not established yet']);
    expect(model.hasPartialEvidence).toBe(true);
  });

  it('orders equally severe reasons by explanation priority and limits compact reasons to two', () => {
    const model = resolveTestHealth({
      metricIds: ['reachability'],
      evidence: [
        evidence({
          id: 'Baseline regression',
          metricId: 'reachability',
          kind: 'baseline',
          state: 'unhealthy',
          explanationPriority: 100,
        }),
        evidence({
          id: 'Absolute threshold breached',
          metricId: 'reachability',
          kind: 'guardrail',
          state: 'unhealthy',
          explanationPriority: 200,
        }),
        evidence({
          id: 'Alert firing',
          metricId: 'reachability',
          kind: 'alert',
          state: 'unhealthy',
          explanationPriority: 400,
        }),
      ],
    });

    expect(model.compactReasons.map((item) => item.summary)).toEqual([
      'Alert firing',
      'Absolute threshold breached',
    ]);
    expect(model.evidence.map((item) => item.summary)).toEqual([
      'Alert firing',
      'Absolute threshold breached',
      'Baseline regression',
    ]);
  });

  it('returns unknown only when no source has known evidence', () => {
    const model = resolveTestHealth({
      metricIds: ['ssl-expiry'],
      evidence: [
        evidence({
          id: 'Certificate unavailable',
          metricId: 'ssl-expiry',
          kind: 'guardrail',
          state: 'unknown',
          explanationPriority: 200,
        }),
      ],
    });

    expect(model.state).toBe('unknown');
    expect(model.compactReasons.map((item) => item.summary)).toEqual(['Certificate unavailable']);
  });

  it('keeps check-level evidence in the overall result without assigning it to every metric', () => {
    const model = resolveTestHealth({
      metricIds: ['uptime', 'reachability'],
      evidence: [
        evidence({
          id: 'SLO burn rate is too high',
          kind: 'slo',
          state: 'unhealthy',
          explanationPriority: 300,
        }),
      ],
    });

    expect(model.state).toBe('unhealthy');
    expect(model.metrics.uptime.state).toBe('unknown');
    expect(model.metrics.reachability.state).toBe('unknown');
  });

  it('retains the alert presentation model for each metric', () => {
    const model = resolveTestHealth({
      metricIds: ['average-latency'],
      evidence: [],
      alerts: {
        'average-latency': {
          alertType: CheckAlertType.HTTPRequestDurationTooHighAvg,
          state: 'not-configured',
          canWrite: true,
        },
      },
    });

    expect(model.metrics['average-latency'].alert).toEqual({
      alertType: CheckAlertType.HTTPRequestDurationTooHighAvg,
      state: 'not-configured',
      canWrite: true,
    });
  });

  it('keeps evaluation health healthy when the selected range was unhealthy', () => {
    const model = resolveTestHealth({
      metricIds: ['reachability'],
      rangeMode: 'live',
      evaluationAt: range.to,
      evidence: [
        evidence({
          id: 'Reachability alert is not firing',
          metricId: 'reachability',
          kind: 'alert',
          state: 'healthy',
          explanationPriority: 400,
        }),
        {
          ...evidence({
            id: 'Reachability was below 99%',
            metricId: 'reachability',
            kind: 'guardrail',
            state: 'unhealthy',
            explanationPriority: 200,
          }),
          scope: 'range',
        },
      ],
    });

    expect(model.state).toBe('healthy');
    expect(model.rangeState).toBe('unhealthy');
    expect(model.metrics.reachability.state).toBe('healthy');
    expect(model.metrics.reachability.rangeState).toBe('unhealthy');
    expect(model.rangeReasons.map(({ id }) => id)).toEqual(['Reachability was below 99%']);
  });

  it('uses evaluation evidence only for compact summary reasons', () => {
    const model = resolveTestHealth({
      metricIds: ['reachability'],
      rangeMode: 'historical',
      evaluationAt: range.to,
      evidence: [
        evidence({
          id: 'Healthy at end',
          metricId: 'reachability',
          kind: 'guardrail',
          state: 'healthy',
          explanationPriority: 200,
        }),
        {
          ...evidence({
            id: 'Incident earlier',
            metricId: 'reachability',
            kind: 'alert',
            state: 'unhealthy',
            explanationPriority: 400,
          }),
          scope: 'range',
        },
      ],
    });

    expect(model.compactReasons.map(({ id }) => id)).toEqual(['Healthy at end']);
    expect(model.rangeReasons.map(({ id }) => id)).toEqual(['Incident earlier']);
    expect(model.rangeMode).toBe('historical');
    expect(model.evaluationAt).toBe(range.to);
  });
});
