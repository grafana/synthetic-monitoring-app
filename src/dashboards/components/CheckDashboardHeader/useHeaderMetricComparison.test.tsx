import React, { type PropsWithChildren } from 'react';
import { dateTime, FieldType, LoadingState, type PanelData } from '@grafana/data';
import { renderHook } from '@testing-library/react';
import { panelDataToTrendSamples } from 'dashboards/components/CheckDashboardHeader/headerMetricSparkline.utils';
import { useDashboardPanelQuery } from 'dashboards/hooks/useDashboardPanelQuery';
import { getHttpHeaderMetrics } from 'dashboards/http/header/httpHeaderMetrics';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import type { HeaderMetricDefinition } from './CheckDashboardHeader.types';
import type { ResolvedDisplayReference } from 'dashboards/comparison/comparisonReference.types';
import { type DashboardComparisonContextValue, useDashboardComparison } from 'contexts/DashboardComparisonProvider';

import { useHeaderMetricComparison } from './useHeaderMetricComparison';

jest.mock('contexts/DashboardComparisonProvider', () => ({
  useDashboardComparison: jest.fn(),
}));
jest.mock('dashboards/hooks/useDashboardPanelQuery', () => ({
  useDashboardPanelQuery: jest.fn(),
}));

const HOUR_MS = 60 * 60 * 1000;
const primaryRange = { from: 0, to: 2 * HOUR_MS };
const previousReference: ResolvedDisplayReference = {
  status: 'valid',
  spec: { kind: 'previous' },
  label: 'Previous period',
  range: { from: -2 * HOUR_MS, to: 0 },
  equalDuration: true,
};
const normalReference = {
  status: 'valid',
  spec: { kind: 'normal' },
  label: 'Normal',
  range: { from: -24 * HOUR_MS, to: 0 },
  equalDuration: false,
} satisfies Extract<ResolvedDisplayReference, { status: 'valid' }>;

function panelData(
  values: number[] = [],
  state: LoadingState = LoadingState.Done,
  times?: number[]
): PanelData {
  return {
    state,
    series:
      values.length === 0
        ? []
        : [
            {
              fields: [
                {
                  name: 'Time',
                  type: FieldType.time,
                  values: values.map((_, index) => times?.[index] ?? index * HOUR_MS),
                  config: {},
                },
                { name: 'Value', type: FieldType.number, values, config: {} },
              ],
              length: values.length,
            },
          ],
    timeRange: {
      from: dateTime(primaryRange.from),
      to: dateTime(primaryRange.to),
      raw: { from: dateTime(primaryRange.from), to: dateTime(primaryRange.to) },
    },
  };
}

function normalPanelData(pattern: number[]): PanelData {
  const values = Array.from({ length: 24 }, (_, index) => pattern[index % pattern.length]!);
  const times = values.map((_, index) => normalReference.range.from + index * HOUR_MS);

  return panelData(values, LoadingState.Done, times);
}

function queryResult(data: PanelData, isLoading = false) {
  return { panelData: data, isLoading, menuItems: undefined, title: undefined };
}

function comparisonValue(overrides: Partial<DashboardComparisonContextValue> = {}): DashboardComparisonContextValue {
  return {
    enabled: true,
    referenceSpec: { kind: 'previous' },
    healthReference: { status: 'not-established' },
    displayReference: previousReference,
    displayAvailability: { status: 'available', coverage: 1, executionCount: 12 },
    setEnabled: jest.fn(),
    setReference: jest.fn(),
    ...overrides,
  };
}

function createMetric({
  supportsNormalBand = true,
  normalBandDomain,
  withNormalBaseline = supportsNormalBand,
}: {
  supportsNormalBand?: boolean;
  normalBandDomain?: { min?: number; max?: number };
  withNormalBaseline?: boolean;
} = {}) {
  const compare = jest.fn(
    ({
      primary,
      reference,
      referenceLabel,
    }: {
      primary: number | null;
      reference: number | null;
      referenceLabel: string;
    }) => ({
      summary: `${primary} compared with ${referenceLabel}`,
      detail: `${reference} reference`,
    })
  );
  const metric: HeaderMetricDefinition = {
    id: 'generic-metric',
    label: 'Generic metric',
    description: 'Generic metric description',
    definition: {
      id: 'generic-metric-value',
      pluginId: 'stat',
      fieldConfig: { defaults: {}, overrides: [] },
      options: {},
      targets: [],
    },
    selectValue: (data) => {
      const value = data.series[0]?.fields.find((field) => field.type === FieldType.number)?.values[0];
      return typeof value === 'number' ? value : null;
    },
    formatValue: (value) => String(value),
    sparkline: {
      definition: {
        id: 'generic-metric-sparkline',
        pluginId: 'timeseries',
        fieldConfig: { defaults: {}, overrides: [] },
        options: {},
        targets: [],
      },
      selectSeries: (data) => {
        const frame = data.series[0];
        const x = frame?.fields.find((field) => field.type === FieldType.time);
        const y = frame?.fields.find((field) => field.type === FieldType.number);

        return y ? { x, y, timeRange: data.timeRange } : null;
      },
    },
    comparison: {
      supportsNormalBand,
      normalBandDomain,
      normalBaseline: withNormalBaseline
        ? {
            definition: {
              id: 'generic-metric-baseline',
              pluginId: 'timeseries',
              fieldConfig: { defaults: {}, overrides: [] },
              options: {},
              maxDataPoints: 720,
              targets: [],
            },
            selectSamples: panelDataToTrendSamples,
          }
        : undefined,
      compare,
    },
  };

  return { compare, metric };
}

function wrapper({ children }: PropsWithChildren) {
  return <>{children}</>;
}

describe('useHeaderMetricComparison', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useDashboardComparison).mockReturnValue(comparisonValue());
    jest
      .mocked(useDashboardPanelQuery)
      .mockImplementation((definition) => {
        if (definition.id.endsWith('baseline') || definition.id.endsWith('sparkline')) {
          return queryResult(
            definition.id.endsWith('baseline')
              ? normalPanelData([0.8, 0.9, 1])
              : panelData([0.8, 0.9, 1])
          );
        }

        return queryResult(panelData([0.7]));
      });
  });

  it('returns null and disables every reference query when comparison is off', () => {
    const { metric } = createMetric();
    jest.mocked(useDashboardComparison).mockReturnValue(
      comparisonValue({
        enabled: false,
        referenceSpec: null,
        displayReference: null,
        displayAvailability: null,
      })
    );

    const { result } = renderHook(
      () =>
        useHeaderMetricComparison({
          metric,
          primaryData: panelData([0.9]),
          primaryValue: 0.9,
        }),
      { wrapper }
    );

    expect(result.current).toBeNull();
    expect(jest.mocked(useDashboardPanelQuery).mock.calls).toEqual([
      [metric.definition, expect.objectContaining({ enabled: false })],
      [metric.sparkline!.definition, expect.objectContaining({ enabled: false })],
      [metric.comparison!.normalBaseline!.definition, expect.objectContaining({ enabled: false })],
    ]);
  });

  it('builds and generically clamps a median/MAD Normal band for a supported metric', () => {
    const { compare, metric } = createMetric({ normalBandDomain: { min: 0, max: 1 } });
    jest.mocked(useDashboardComparison).mockReturnValue(
      comparisonValue({
        referenceSpec: { kind: 'normal' },
        displayReference: normalReference,
        displayAvailability: {
          status: 'available',
          tierId: '24h',
          coverage: 1,
          executionCount: 24,
          range: normalReference.range,
        },
      })
    );

    const primaryData = panelData([0.95]);
    const { result } = renderHook(() => useHeaderMetricComparison({ metric, primaryData, primaryValue: 0.95 }), {
      wrapper,
    });

    expect(result.current).toMatchObject({
      state: 'ready',
      summary: '0.95 compared with Normal',
      detail: '0.9 reference · Normal · 24h · 100% coverage · 24 executions',
      visual: { kind: 'normal-band', label: 'Normal', median: 0.9 },
    });
    expect(result.current?.visual?.kind).toBe('normal-band');
    if (result.current?.visual?.kind === 'normal-band') {
      expect(result.current.visual.lower).toBeCloseTo(0.6);
      expect(result.current.visual.upper).toBe(1);
    }
    expect(useDashboardPanelQuery).toHaveBeenNthCalledWith(1, metric.definition, {
      range: normalReference.range,
      enabled: false,
    });
    expect(useDashboardPanelQuery).toHaveBeenNthCalledWith(2, metric.sparkline!.definition, {
      range: normalReference.range,
      enabled: false,
    });
    expect(useDashboardPanelQuery).toHaveBeenCalledWith(metric.comparison!.normalBaseline!.definition, {
      range: normalReference.range,
      enabled: true,
    });
    expect(compare).toHaveBeenCalledWith({
      primary: 0.95,
      reference: 0.9,
      referenceKind: 'normal',
      referenceLabel: 'Normal',
      primaryDurationMs: 2 * HOUR_MS,
      referenceDurationMs: 24 * HOUR_MS,
      primaryData,
      referenceData: expect.objectContaining({ series: expect.any(Array) }),
    });
  });

  it.each([
    {
      availability: { status: 'checking' } as const,
      expected: { state: 'loading' },
    },
    {
      availability: { status: 'query-error' } as const,
      expected: { state: 'unavailable', message: 'Comparison unavailable' },
    },
    {
      availability: { status: 'not-established' } as const,
      expected: { state: 'unavailable', message: 'Normal not established for this period' },
    },
  ])('keeps Normal availability evidence distinct for $availability.status', ({ availability, expected }) => {
    const { metric } = createMetric();
    jest.mocked(useDashboardComparison).mockReturnValue(
      comparisonValue({
        referenceSpec: { kind: 'normal' },
        displayReference: {
          status: 'invalid',
          spec: { kind: 'normal' },
          label: 'Normal',
          reason: 'normal-not-established',
        },
        displayAvailability: availability,
      })
    );

    const { result } = renderHook(
      () =>
        useHeaderMetricComparison({
          metric,
          primaryData: panelData([0.9]),
          primaryValue: 0.9,
        }),
      { wrapper }
    );

    expect(result.current).toEqual(expected);
  });

  it('reports metric-specific unavailable evidence when a Normal series has no samples', () => {
    const { compare, metric } = createMetric();
    jest.mocked(useDashboardComparison).mockReturnValue(
      comparisonValue({
        referenceSpec: { kind: 'normal' },
        displayReference: normalReference,
        displayAvailability: {
          status: 'available',
          tierId: '24h',
          coverage: 1,
          executionCount: 24,
          range: normalReference.range,
        },
      })
    );
    jest
      .mocked(useDashboardPanelQuery)
      .mockImplementation((definition) =>
        definition.id.endsWith('baseline') ? queryResult(panelData()) : queryResult(panelData([0.7]))
      );

    const { result } = renderHook(
      () =>
        useHeaderMetricComparison({
          metric,
          primaryData: panelData([0.9]),
          primaryValue: 0.9,
        }),
      { wrapper }
    );

    expect(result.current).toEqual({
      state: 'unavailable',
      message: 'No Normal data for Generic metric',
    });
    expect(compare).not.toHaveBeenCalled();
  });

  it('reports metric-specific unavailable evidence when a manual reference has no summary value', () => {
    const { compare, metric } = createMetric();
    jest
      .mocked(useDashboardPanelQuery)
      .mockImplementation((definition) =>
        definition.id.endsWith('sparkline') ? queryResult(panelData([0.8, 0.9, 1])) : queryResult(panelData())
      );

    const { result } = renderHook(
      () =>
        useHeaderMetricComparison({
          metric,
          primaryData: panelData([0.9]),
          primaryValue: 0.9,
        }),
      { wrapper }
    );

    expect(result.current).toEqual({
      state: 'unavailable',
      message: 'No Previous period data for Generic metric',
    });
    expect(compare).not.toHaveBeenCalled();
  });

  it('uses the learned Normal series median for the registered HTTP latency copy', () => {
    const metric = getHttpHeaderMetrics(BASIC_HTTP_CHECK).find(({ id }) => id === 'average-latency')!;
    jest.mocked(useDashboardComparison).mockReturnValue(
      comparisonValue({
        referenceSpec: { kind: 'normal' },
        displayReference: normalReference,
        displayAvailability: {
          status: 'available',
          tierId: '24h',
          coverage: 1,
          executionCount: 24,
          range: normalReference.range,
        },
      })
    );
    jest
      .mocked(useDashboardPanelQuery)
      .mockImplementation((definition) =>
        definition.id.endsWith('baseline')
          ? queryResult(normalPanelData([0.3, 0.36, 0.4]))
          : queryResult(panelData([0.7]))
      );

    const { result } = renderHook(
      () =>
        useHeaderMetricComparison({
          metric,
          primaryData: panelData([0.47]),
          primaryValue: 0.47,
        }),
      { wrapper }
    );

    expect(result.current).toMatchObject({
      state: 'ready',
      summary: '0.11 s slower than Normal',
      detail: '31% slower · Normal median 0.36 s · Normal · 24h · 100% coverage · 24 executions',
      visual: { kind: 'normal-band', median: 0.36 },
    });
    expect(useDashboardPanelQuery).toHaveBeenCalledWith(metric.comparison!.normalBaseline!.definition, {
      range: normalReference.range,
      enabled: true,
    });
    expect(
      jest
        .mocked(useDashboardPanelQuery)
        .mock.calls.some(([definition, options]) => definition === metric.definition && options?.enabled)
    ).toBe(false);
  });

  it.each([
    ['Previous period', previousReference],
    [
      '14 days earlier',
      {
        ...previousReference,
        spec: { kind: 'shifted', presetId: '14d' } as const,
        label: '14 days earlier',
      },
    ],
    [
      'Custom range',
      {
        ...previousReference,
        spec: {
          kind: 'custom',
          from: '2026-07-01T00:00:00.000Z',
          to: '2026-07-01T02:00:00.000Z',
          matchPrimaryDuration: true,
        } as const,
        label: 'Custom range',
      },
    ],
  ])('builds an overlay for an equal-duration %s reference', (_label, displayReference) => {
    const { metric } = createMetric();
    jest.mocked(useDashboardComparison).mockReturnValue(
      comparisonValue({
        referenceSpec: displayReference.spec,
        displayReference,
      })
    );

    const { result } = renderHook(
      () =>
        useHeaderMetricComparison({
          metric,
          primaryData: panelData([0.9]),
          primaryValue: 0.9,
        }),
      { wrapper }
    );

    expect(result.current).toMatchObject({
      state: 'ready',
      visual: {
        kind: 'overlay',
        label: displayReference.label,
        series: expect.objectContaining({
          y: expect.objectContaining({ values: [0.8, 0.9, 1] }),
        }),
      },
    });
  });

  it('uses summary-only evidence for an unequal custom reference and skips the sparkline query', () => {
    const { metric } = createMetric();
    const displayReference: ResolvedDisplayReference = {
      status: 'valid',
      spec: {
        kind: 'custom',
        from: '2026-07-01T00:00:00.000Z',
        to: '2026-07-01T01:00:00.000Z',
        matchPrimaryDuration: false,
      },
      label: 'Custom range',
      range: { from: -HOUR_MS, to: 0 },
      equalDuration: false,
    };
    jest.mocked(useDashboardComparison).mockReturnValue(
      comparisonValue({
        referenceSpec: displayReference.spec,
        displayReference,
      })
    );

    const { result } = renderHook(
      () =>
        useHeaderMetricComparison({
          metric,
          primaryData: panelData([0.9]),
          primaryValue: 0.9,
        }),
      { wrapper }
    );

    expect(result.current).toMatchObject({
      state: 'ready',
      visual: { kind: 'summary-only' },
    });
    expect(useDashboardPanelQuery).toHaveBeenNthCalledWith(
      1,
      metric.definition,
      expect.objectContaining({ enabled: true })
    );
    expect(useDashboardPanelQuery).toHaveBeenNthCalledWith(
      2,
      metric.sparkline!.definition,
      expect.objectContaining({ enabled: false })
    );
    expect(useDashboardPanelQuery).toHaveBeenNthCalledWith(
      3,
      metric.comparison!.normalBaseline!.definition,
      expect.objectContaining({ enabled: false })
    );
  });

  it('keeps SSL Normal comparison as summary evidence without a learned band', () => {
    const { metric } = createMetric({ supportsNormalBand: false });
    jest.mocked(useDashboardComparison).mockReturnValue(
      comparisonValue({
        referenceSpec: { kind: 'normal' },
        displayReference: normalReference,
        displayAvailability: {
          status: 'available',
          tierId: '24h',
          coverage: 1,
          executionCount: 24,
          range: normalReference.range,
        },
      })
    );

    const { result } = renderHook(
      () =>
        useHeaderMetricComparison({
          metric,
          primaryData: panelData([0.9]),
          primaryValue: 0.9,
        }),
      { wrapper }
    );

    expect(result.current).toMatchObject({
      state: 'ready',
      visual: { kind: 'summary-only' },
    });
    expect(useDashboardPanelQuery).toHaveBeenNthCalledWith(
      1,
      metric.definition,
      expect.objectContaining({ enabled: true })
    );
    expect(useDashboardPanelQuery).toHaveBeenNthCalledWith(
      2,
      metric.sparkline!.definition,
      expect.objectContaining({ enabled: false })
    );
    expect(useDashboardPanelQuery).toHaveBeenNthCalledWith(
      3,
      metric.definition,
      expect.objectContaining({ enabled: false })
    );
  });

  it('appends partial coverage and execution count to the comparison detail', () => {
    const { metric } = createMetric();
    jest.mocked(useDashboardComparison).mockReturnValue(
      comparisonValue({
        displayAvailability: { status: 'partial', coverage: 0.625, executionCount: 15.6 },
      })
    );

    const { result } = renderHook(
      () =>
        useHeaderMetricComparison({
          metric,
          primaryData: panelData([0.9]),
          primaryValue: 0.9,
        }),
      { wrapper }
    );

    expect(result.current?.detail).toBe('0.7 reference · 63% coverage · 16 executions');
  });

  it('reports a display metric query error without changing the supplied primary data', () => {
    const { compare, metric } = createMetric();
    const primaryData = panelData([0.9]);
    jest.mocked(useDashboardPanelQuery).mockImplementation((definition) =>
      definition.id === metric.definition.id
        ? queryResult({
            ...panelData(),
            state: LoadingState.Error,
            error: new Error('reference failed'),
          })
        : queryResult(panelData([0.8, 0.9, 1]))
    );

    const { result } = renderHook(() => useHeaderMetricComparison({ metric, primaryData, primaryValue: 0.9 }), {
      wrapper,
    });

    expect(result.current).toEqual({
      state: 'unavailable',
      message: 'Comparison unavailable',
    });
    expect(primaryData.series[0]?.fields[1]?.values).toEqual([0.9]);
    expect(compare).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: 'empty',
      context: comparisonValue({
        enabled: false,
        referenceSpec: null,
        displayReference: null,
        displayAvailability: null,
      }),
    },
    {
      name: 'invalid',
      context: comparisonValue({
        displayReference: {
          status: 'invalid',
          spec: {
            kind: 'custom',
            from: 'invalid',
            to: 'invalid',
            matchPrimaryDuration: false,
          },
          label: 'Custom range',
          reason: 'invalid-range',
        },
        displayAvailability: { status: 'invalid-range' },
      }),
    },
    {
      name: 'unavailable',
      context: comparisonValue({
        displayAvailability: { status: 'no-retained-executions' },
      }),
    },
  ])('disables metric reference queries for an $name display reference', ({ context }) => {
    const { metric } = createMetric();
    jest.mocked(useDashboardComparison).mockReturnValue(context);

    renderHook(
      () =>
        useHeaderMetricComparison({
          metric,
          primaryData: panelData([0.9]),
          primaryValue: 0.9,
        }),
      { wrapper }
    );

    expect(jest.mocked(useDashboardPanelQuery).mock.calls).toEqual([
      [metric.definition, expect.objectContaining({ enabled: false })],
      [metric.sparkline!.definition, expect.objectContaining({ enabled: false })],
      [metric.comparison!.normalBaseline!.definition, expect.objectContaining({ enabled: false })],
    ]);
  });
});
