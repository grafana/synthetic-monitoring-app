import { createDataFrame, LoadingState, type PanelData } from '@grafana/data';

import { compareLatency, comparePercentagePoints, compareSslCertificate } from './httpMetricComparison';

const DAY_MS = 86_400_000;
const DAY_SECONDS = 86_400;

function panelData({
  expiry,
  fingerprint,
  remaining,
  timestamp,
}: {
  expiry?: number;
  fingerprint?: string;
  remaining?: number;
  timestamp?: number;
} = {}): PanelData {
  if (remaining === undefined) {
    return {
      state: LoadingState.Done,
      series: [],
      timeRange: {} as PanelData['timeRange'],
    };
  }

  return {
    state: LoadingState.Done,
    series: [
      createDataFrame({
        fields: [
          ...(timestamp === undefined ? [] : [{ name: 'Time', values: [timestamp] }]),
          {
            name: 'Value',
            values: [remaining],
            labels:
              fingerprint || expiry
                ? {
                    ...(fingerprint ? { certificate_fingerprint: fingerprint } : {}),
                    ...(expiry ? { certificate_not_after: String(expiry) } : {}),
                  }
                : undefined,
          },
        ],
      }),
    ],
    timeRange: {} as PanelData['timeRange'],
  };
}

function panelDataWithSeries(...series: PanelData['series']): PanelData {
  return {
    state: LoadingState.Done,
    series,
    timeRange: {} as PanelData['timeRange'],
  };
}

describe('HTTP header metric comparison semantics', () => {
  it('compares availability ratios as percentage-point differences', () => {
    expect(
      comparePercentagePoints({
        primary: 0.995,
        reference: 0.999,
        referenceLabel: 'Previous period',
      })
    ).toEqual({
      summary: '0.4 pp lower than Previous period',
      detail: '99.50% now · 99.90% reference',
    });
  });

  it('describes equal percentage values as in line with the reference', () => {
    expect(
      comparePercentagePoints({
        primary: 0.999,
        reference: 0.999,
        referenceLabel: 'Normal',
      })
    ).toEqual({
      summary: 'In line with Normal',
      detail: '99.90% now · 99.90% reference',
    });
  });

  it('uses displayed percentage-point precision to decide whether values are in line', () => {
    expect(
      comparePercentagePoints({
        primary: 0.9994,
        reference: 0.999,
        referenceLabel: 'Normal',
      })
    ).toEqual({
      summary: 'In line with Normal',
      detail: '99.94% now · 99.90% reference',
    });
  });

  it('reports both range durations when they are unequal', () => {
    expect(
      comparePercentagePoints({
        primary: 1,
        reference: 0.99,
        referenceLabel: 'Previous period',
        primaryDurationMs: 2 * 60 * 60 * 1000,
        referenceDurationMs: 60 * 60 * 1000,
      })
    ).toEqual({
      summary: '1.0 pp higher than Previous period',
      detail: '100.00% now · 99.00% reference · Current range: 2 hours · Previous period range: 1 hour',
    });
  });

  it('reports absolute and relative latency change with slower direction', () => {
    const input = {
      primary: 0.47,
      reference: 0.36,
      referenceKind: 'normal' as const,
      referenceLabel: 'Normal',
    };

    expect(compareLatency(input)).toEqual({
      summary: '0.11 s slower than Normal',
      detail: '31% slower · Normal median 0.36 s',
    });
  });

  it('uses average wording for a manual reference', () => {
    const input = {
      primary: 0.47,
      reference: 0.36,
      referenceKind: 'previous' as const,
      referenceLabel: 'Previous period',
    };

    expect(compareLatency(input)).toEqual({
      summary: '0.11 s slower than Previous period',
      detail: '31% slower · Previous period average 0.36 s',
    });
  });

  it('reports lower latency as faster', () => {
    const input = {
      primary: 0.25,
      reference: 0.36,
      referenceKind: 'previous' as const,
      referenceLabel: 'Previous period',
    };

    expect(compareLatency(input)).toEqual({
      summary: '0.11 s faster than Previous period',
      detail: '31% faster · Previous period average 0.36 s',
    });
  });

  it('uses displayed latency precision to decide whether values are in line', () => {
    const input = {
      primary: 0.364,
      reference: 0.36,
      referenceKind: 'normal' as const,
      referenceLabel: 'Normal',
    };

    expect(compareLatency(input)).toEqual({
      summary: 'In line with Normal',
      detail: 'Normal median 0.36 s',
    });
  });

  it.each([
    {
      direction: 'slower',
      primary: 2.006,
      summary: '0.01 s slower than Previous period',
    },
    {
      direction: 'faster',
      primary: 1.994,
      summary: '0.01 s faster than Previous period',
    },
  ])('reports a directional sub-one-percent latency change as <1% $direction', ({ direction, primary, summary }) => {
    const input = {
      primary,
      reference: 2,
      referenceKind: 'previous' as const,
      referenceLabel: 'Previous period',
    };

    expect(compareLatency(input)).toEqual({
      summary,
      detail: `<1% ${direction} · Previous period average 2.00 s`,
    });
  });

  it('states when relative latency change is unavailable from a zero reference', () => {
    const input = {
      primary: 0.11,
      reference: 0,
      referenceKind: 'previous' as const,
      referenceLabel: 'Previous period',
    };

    expect(compareLatency(input)).toEqual({
      summary: '0.11 s slower than Previous period',
      detail: 'Relative change unavailable from a zero reference · Previous period average 0.00 s',
    });
  });

  it('returns null for missing and non-finite values', () => {
    expect(
      comparePercentagePoints({ primary: Number.POSITIVE_INFINITY, reference: 1, referenceLabel: 'Normal' })
    ).toBeNull();
    expect(comparePercentagePoints({ primary: Number.NaN, reference: 1, referenceLabel: 'Normal' })).toBeNull();
    expect(comparePercentagePoints({ primary: null, reference: 1, referenceLabel: 'Normal' })).toBeNull();
    expect(compareLatency({ primary: Number.NEGATIVE_INFINITY, reference: 0.2, referenceLabel: 'Normal' })).toBeNull();
    expect(compareLatency({ primary: 0.2, reference: null, referenceLabel: 'Normal' })).toBeNull();
    expect(compareLatency({ primary: 0.2, reference: Number.NaN, referenceLabel: 'Normal' })).toBeNull();
    expect(
      compareSslCertificate({
        primary: Number.POSITIVE_INFINITY,
        reference: DAY_SECONDS,
        referenceLabel: 'Previous period',
        primaryData: panelData(),
        referenceData: panelData(),
      })
    ).toBeNull();
  });

  it('treats a changed certificate fingerprint as a renewal', () => {
    const referenceTimestamp = Date.UTC(2026, 5, 1);
    const primaryTimestamp = referenceTimestamp + DAY_MS;

    expect(
      compareSslCertificate({
        primary: 89 * DAY_SECONDS,
        reference: 30 * DAY_SECONDS,
        referenceLabel: 'Previous period',
        primaryData: panelData({
          fingerprint: 'new-certificate',
          remaining: 89 * DAY_SECONDS,
          timestamp: primaryTimestamp,
        }),
        referenceData: panelData({
          fingerprint: 'old-certificate',
          remaining: 30 * DAY_SECONDS,
          timestamp: referenceTimestamp,
        }),
      })
    ).toEqual({
      summary: 'Certificate renewed',
      detail: 'Certificate identity changed since Previous period',
    });
  });

  it('treats the same certificate countdown as expected expiry progression', () => {
    const referenceTimestamp = Date.UTC(2026, 5, 1);
    const primaryTimestamp = referenceTimestamp + DAY_MS;

    expect(
      compareSslCertificate({
        primary: 29 * DAY_SECONDS,
        reference: 30 * DAY_SECONDS,
        referenceLabel: 'Previous period',
        primaryData: panelData({
          fingerprint: 'same-certificate',
          remaining: 29 * DAY_SECONDS,
          timestamp: primaryTimestamp,
        }),
        referenceData: panelData({
          fingerprint: 'same-certificate',
          remaining: 30 * DAY_SECONDS,
          timestamp: referenceTimestamp,
        }),
      })
    ).toEqual({
      summary: 'Expiry progressing as expected',
      detail: 'Same certificate · 29d remaining now',
    });
  });

  it('calls an earlier expiry date for the same certificate explicit', () => {
    const referenceTimestamp = Date.UTC(2026, 5, 1);
    const primaryTimestamp = referenceTimestamp + DAY_MS;

    expect(
      compareSslCertificate({
        primary: 20 * DAY_SECONDS,
        reference: 30 * DAY_SECONDS,
        referenceLabel: 'Previous period',
        primaryData: panelData({
          fingerprint: 'same-certificate',
          remaining: 20 * DAY_SECONDS,
          timestamp: primaryTimestamp,
        }),
        referenceData: panelData({
          fingerprint: 'same-certificate',
          remaining: 30 * DAY_SECONDS,
          timestamp: referenceTimestamp,
        }),
      })
    ).toEqual({
      summary: 'Certificate expiry moved earlier',
      detail: 'Same certificate · expiry moved 9 days earlier',
    });
  });

  it('uses explicit expiry metadata when observation timestamps are unavailable', () => {
    const referenceExpiry = Date.UTC(2026, 6, 1);
    const primaryExpiry = referenceExpiry - 3 * DAY_MS;

    expect(
      compareSslCertificate({
        primary: 20 * DAY_SECONDS,
        reference: 30 * DAY_SECONDS,
        referenceLabel: 'Previous period',
        primaryData: panelData({
          expiry: primaryExpiry,
          fingerprint: 'same-certificate',
          remaining: 20 * DAY_SECONDS,
        }),
        referenceData: panelData({
          expiry: referenceExpiry,
          fingerprint: 'same-certificate',
          remaining: 30 * DAY_SECONDS,
        }),
      })
    ).toEqual({
      summary: 'Certificate expiry moved earlier',
      detail: 'Same certificate · expiry moved 3 days earlier',
    });
  });

  it('describes a forward expiry movement for the same identity as an extension, not renewal', () => {
    const referenceExpiry = Date.UTC(2026, 6, 1);
    const primaryExpiry = referenceExpiry + 31 * DAY_MS;

    expect(
      compareSslCertificate({
        primary: 60 * DAY_SECONDS,
        reference: 30 * DAY_SECONDS,
        referenceLabel: 'Previous period',
        primaryData: panelData({
          expiry: primaryExpiry,
          fingerprint: 'same-certificate',
          remaining: 60 * DAY_SECONDS,
        }),
        referenceData: panelData({
          expiry: referenceExpiry,
          fingerprint: 'same-certificate',
          remaining: 30 * DAY_SECONDS,
        }),
      })
    ).toEqual({
      summary: 'Certificate expiry extended',
      detail: 'Same certificate · expiry moved 31 days later',
    });
  });

  it('qualifies a large forward expiry movement when certificate identity is unavailable', () => {
    const referenceTimestamp = Date.UTC(2026, 5, 1);
    const primaryTimestamp = referenceTimestamp + DAY_MS;

    expect(
      compareSslCertificate({
        primary: 89 * DAY_SECONDS,
        reference: 30 * DAY_SECONDS,
        referenceLabel: 'Previous period',
        primaryData: panelData({ remaining: 89 * DAY_SECONDS, timestamp: primaryTimestamp }),
        referenceData: panelData({ remaining: 30 * DAY_SECONDS, timestamp: referenceTimestamp }),
      })
    ).toEqual({
      summary: 'Certificate likely renewed',
      detail: 'Expiry moved 60 days later · certificate identity unavailable',
    });
  });

  it('associates identity and time metadata with the reverse-series selected numeric value', () => {
    const referenceTimestamp = Date.UTC(2026, 5, 1);
    const primaryTimestamp = referenceTimestamp + DAY_MS;
    const unrelatedFrame = createDataFrame({
      fields: [
        { name: 'Time', values: [primaryTimestamp + 100 * DAY_MS] },
        {
          name: 'Value',
          values: [89 * DAY_SECONDS],
          labels: { certificate_fingerprint: 'unrelated-certificate' },
        },
      ],
    });
    const selectedFrame = createDataFrame({
      fields: [
        { name: 'Time', values: [primaryTimestamp] },
        {
          name: 'Value',
          values: [29 * DAY_SECONDS],
          labels: { certificate_fingerprint: 'same-certificate' },
        },
      ],
    });

    expect(
      compareSslCertificate({
        primary: 29 * DAY_SECONDS,
        reference: 30 * DAY_SECONDS,
        referenceLabel: 'Previous period',
        primaryData: panelDataWithSeries(unrelatedFrame, selectedFrame),
        referenceData: panelData({
          fingerprint: 'same-certificate',
          remaining: 30 * DAY_SECONDS,
          timestamp: referenceTimestamp,
        }),
      })
    ).toEqual({
      summary: 'Expiry progressing as expected',
      detail: 'Same certificate · 29d remaining now',
    });
  });

  it('describes a negative SSL value as expired rather than remaining', () => {
    expect(
      compareSslCertificate({
        primary: -2 * DAY_SECONDS,
        reference: -DAY_SECONDS,
        referenceLabel: 'Previous period',
        primaryData: panelData(),
        referenceData: panelData(),
      })
    ).toEqual({
      summary: 'Certificate expired',
      detail: 'Expired 2d ago · certificate identity unavailable',
    });
  });

  it('never calls an ordinary certificate countdown worse when timestamps are unavailable', () => {
    const comparison = compareSslCertificate({
      primary: 29 * DAY_SECONDS,
      reference: 30 * DAY_SECONDS,
      referenceLabel: 'Previous period',
      primaryData: panelData(),
      referenceData: panelData(),
    });

    expect(comparison).toEqual({
      summary: 'Expiry progressing as expected',
      detail: '29d remaining now · certificate identity unavailable',
    });
    expect(`${comparison?.summary} ${comparison?.detail}`).not.toMatch(/worse|degrad/i);
  });
});
