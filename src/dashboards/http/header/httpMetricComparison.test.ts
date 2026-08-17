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
        referenceLabel: '30 days ago',
      })
    ).toEqual({
      plain: '0.40 pp lower',
      compact: '↓ 0.40 pp',
      detail: '99.50% selected · 99.90% reference',
    });
  });

  it('describes equal percentage values neutrally', () => {
    expect(
      comparePercentagePoints({
        primary: 0.999,
        reference: 0.999,
        referenceLabel: '30 days ago',
      })
    ).toEqual({
      plain: 'No change',
      compact: '→ 0.00 pp',
      detail: '99.90% selected · 99.90% reference',
    });
  });

  it('uses displayed percentage-point precision to decide whether values are in line', () => {
    expect(
      comparePercentagePoints({
        primary: 0.9994,
        reference: 0.999,
        referenceLabel: '30 days ago',
      })
    ).toEqual({
      plain: '0.04 pp higher',
      compact: '↑ 0.04 pp',
      detail: '99.94% selected · 99.90% reference',
    });
  });

  it('reports "No change" only when the two-decimal displayed values are identical', () => {
    expect(
      comparePercentagePoints({
        primary: 0.99951,
        reference: 0.99949,
        referenceLabel: '30 days ago',
      })
    ).toEqual({
      plain: 'No change',
      compact: '→ 0.00 pp',
      detail: '99.95% selected · 99.95% reference',
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
      plain: '1.00 pp higher',
      compact: '↑ 1.00 pp',
      detail: '100.00% selected · 99.00% reference · Current range: 2 hours · Previous period range: 1 hour',
    });
  });

  it('reports absolute and relative latency change with slower direction', () => {
    const input = {
      primary: 0.47,
      reference: 0.36,
      referenceKind: 'shifted' as const,
      referenceLabel: '30 days ago',
    };

    expect(compareLatency(input)).toEqual({
      plain: '31% slower',
      compact: '↑ 31%',
      detail: '0.11 s slower · 30 days ago average 0.36 s',
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
      plain: '31% slower',
      compact: '↑ 31%',
      detail: '0.11 s slower · Previous period average 0.36 s',
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
      plain: '31% faster',
      compact: '↓ 31%',
      detail: '0.11 s faster · Previous period average 0.36 s',
    });
  });

  it('uses displayed latency precision to decide whether values are in line', () => {
    const input = {
      primary: 0.364,
      reference: 0.36,
      referenceKind: 'shifted' as const,
      referenceLabel: '30 days ago',
    };

    expect(compareLatency(input)).toEqual({
      plain: 'No change',
      compact: '→ 0%',
      detail: '30 days ago average 0.36 s',
    });
  });

  it.each([
    {
      direction: 'slower',
      primary: 2.006,
      compact: '↑ <1%',
    },
    {
      direction: 'faster',
      primary: 1.994,
      compact: '↓ <1%',
    },
  ])('reports a directional sub-one-percent latency change as <1% $direction', ({ compact, direction, primary }) => {
    const input = {
      primary,
      reference: 2,
      referenceKind: 'previous' as const,
      referenceLabel: 'Previous period',
    };

    expect(compareLatency(input)).toEqual({
      plain: `<1% ${direction}`,
      compact,
      detail: `0.01 s ${direction} · Previous period average 2.00 s`,
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
      plain: '0.11 s slower',
      compact: '↑ 0.11 s',
      detail: 'Relative change unavailable from a zero reference · Previous period average 0.00 s',
    });
  });

  it('returns null for missing and non-finite values', () => {
    expect(
      comparePercentagePoints({ primary: Number.POSITIVE_INFINITY, reference: 1, referenceLabel: '30 days ago' })
    ).toBeNull();
    expect(comparePercentagePoints({ primary: Number.NaN, reference: 1, referenceLabel: '30 days ago' })).toBeNull();
    expect(comparePercentagePoints({ primary: null, reference: 1, referenceLabel: '30 days ago' })).toBeNull();
    expect(compareLatency({ primary: Number.NEGATIVE_INFINITY, reference: 0.2, referenceLabel: '30 days ago' })).toBeNull();
    expect(compareLatency({ primary: 0.2, reference: null, referenceLabel: '30 days ago' })).toBeNull();
    expect(compareLatency({ primary: 0.2, reference: Number.NaN, referenceLabel: '30 days ago' })).toBeNull();
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
      plain: 'Certificate renewed',
      compact: 'Renewed',
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
      plain: 'Expiry progressing as expected',
      compact: '→ On track',
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
      plain: 'Certificate expiry moved earlier',
      compact: '← 9 days',
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
      plain: 'Certificate expiry moved earlier',
      compact: '← 3 days',
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
      plain: 'Certificate expiry extended',
      compact: '→ 31 days',
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
      plain: 'Certificate likely renewed',
      compact: 'Likely renewed',
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
      plain: 'Expiry progressing as expected',
      compact: '→ On track',
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
      plain: 'Certificate expired',
      compact: 'Expired',
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
      plain: 'Expiry progressing as expected',
      compact: '→ On track',
      detail: '29d remaining now · certificate identity unavailable',
    });
    expect(`${comparison?.plain} ${comparison?.detail}`).not.toMatch(/worse|degrad/i);
  });
});
