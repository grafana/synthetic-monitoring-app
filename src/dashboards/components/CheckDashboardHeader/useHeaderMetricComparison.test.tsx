import React, { type PropsWithChildren } from 'react';
import { dateTime, FieldType, LoadingState, type PanelData } from '@grafana/data';
import { renderHook } from '@testing-library/react';
import { useDashboardPanelQuery } from 'dashboards/hooks/useDashboardPanelQuery';

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

function panelData(
  values: number[] = [],
  state: LoadingState = LoadingState.Done
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
                  values: values.map((_, index) => index * HOUR_MS),
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
    automaticSelection: { status: 'inactive' },
    setEnabled: jest.fn(),
    setReference: jest.fn(),
    retryAutomaticSelection: jest.fn(),
    ...overrides,
  };
}

function createMetric() {
  const compare = jest.fn(
    ({
      primary,
      reference,
    }: {
      primary: number | null;
      reference: number | null;
    }) =>
      primary === null || reference === null
        ? null
        : {
            plain: `${primary - reference} higher`,
            compact: `↑ ${primary - reference}`,
            detail: `${primary} selected · ${reference} reference`,
          }
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
    formatValue: (value) => (value === null ? 'N/A' : `${value.toFixed(2)} ms`),
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
    comparison: { compare },
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
    jest.mocked(useDashboardPanelQuery).mockImplementation((definition) =>
      queryResult(definition.id.endsWith('sparkline') ? panelData([0.7, 0.8]) : panelData([0.7]))
    );
  });

  it('returns null and disables reference queries when comparison is off', () => {
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
      () => useHeaderMetricComparison({ metric, primaryData: panelData([0.9]), primaryValue: 0.9 }),
      { wrapper }
    );

    expect(result.current).toBeNull();
    expect(useDashboardPanelQuery).toHaveBeenNthCalledWith(
      1,
      metric.definition,
      expect.objectContaining({ enabled: false })
    );
    expect(useDashboardPanelQuery).toHaveBeenNthCalledWith(
      2,
      metric.sparkline!.definition,
      expect.objectContaining({ enabled: false })
    );
  });

  it.each([
    [{ status: 'finding', candidatePresetId: '30d' } as const, { state: 'loading' }],
    [{ status: 'no-data' } as const, { state: 'unavailable', message: 'No comparison data found' }],
    [{ status: 'query-error' } as const, { state: 'unavailable', message: 'Could not find comparison data' }],
  ])('reflects automatic-selection state without issuing metric queries', (automaticSelection, expected) => {
    const { metric } = createMetric();
    jest.mocked(useDashboardComparison).mockReturnValue(
      comparisonValue({
        referenceSpec: { kind: 'auto' },
        displayReference: null,
        displayAvailability: null,
        automaticSelection,
      })
    );

    const { result } = renderHook(
      () => useHeaderMetricComparison({ metric, primaryData: panelData([0.9]), primaryValue: 0.9 }),
      { wrapper }
    );

    expect(result.current).toEqual(expected);
    expect(jest.mocked(useDashboardPanelQuery).mock.calls.every(([, options]) => options?.enabled === false)).toBe(true);
  });

  it('returns locally cyclable readings, a fixed caption, and an additive overlay', () => {
    const { compare, metric } = createMetric();

    const { result } = renderHook(
      () => useHeaderMetricComparison({ metric, primaryData: panelData([0.9]), primaryValue: 0.9 }),
      { wrapper }
    );

    expect(result.current).toMatchObject({
      state: 'ready',
      readings: {
        plain: '0.20000000000000007 higher',
        reference: '0.70 ms',
      },
      caption: 'Compared to Previous period',
      detail: '0.9 selected · 0.7 reference',
      visual: {
        kind: 'overlay',
        label: 'Previous period',
        series: expect.objectContaining({
          y: expect.objectContaining({ values: [0.7, 0.8] }),
        }),
      },
    });
    expect(compare).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceKind: 'previous',
        referenceLabel: 'Previous period',
      })
    );
  });

  it('uses summary-only evidence for an unequal reference and skips the sparkline query', () => {
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
      () => useHeaderMetricComparison({ metric, primaryData: panelData([0.9]), primaryValue: 0.9 }),
      { wrapper }
    );

    expect(result.current).toMatchObject({
      state: 'ready',
      caption: 'Compared to Custom range',
      visual: { kind: 'summary-only' },
    });
    expect(useDashboardPanelQuery).toHaveBeenNthCalledWith(
      2,
      metric.sparkline!.definition,
      expect.objectContaining({ enabled: false })
    );
  });

  it('uses the full baseline average as a horizontal sparkline reference', () => {
    const { metric } = createMetric();
    metric.comparison!.normalBaseline = {
      definition: metric.definition,
      selectSamples: () => [],
    };
    const displayReference: ResolvedDisplayReference = {
      status: 'valid',
      spec: { kind: 'baseline', presetId: '14d' },
      label: 'Last 14 days',
      range: { from: -14 * 24 * HOUR_MS, to: 0 },
      equalDuration: false,
    };
    jest.mocked(useDashboardComparison).mockReturnValue(
      comparisonValue({
        referenceSpec: displayReference.spec,
        displayReference,
      })
    );

    const { result } = renderHook(
      () => useHeaderMetricComparison({ metric, primaryData: panelData([0.9]), primaryValue: 0.9 }),
      { wrapper }
    );

    expect(result.current).toMatchObject({
      state: 'ready',
      caption: 'Compared to Last 14 days',
      visual: {
        kind: 'baseline-average',
        label: 'Last 14 days average',
        value: 0.7,
      },
    });
    expect(useDashboardPanelQuery).toHaveBeenNthCalledWith(
      2,
      metric.sparkline!.definition,
      expect.objectContaining({ enabled: false })
    );
  });

  it('appends partial coverage to detail without changing the fixed caption', () => {
    const { metric } = createMetric();
    jest.mocked(useDashboardComparison).mockReturnValue(
      comparisonValue({
        displayAvailability: { status: 'partial', coverage: 0.625, executionCount: 15.6 },
      })
    );

    const { result } = renderHook(
      () => useHeaderMetricComparison({ metric, primaryData: panelData([0.9]), primaryValue: 0.9 }),
      { wrapper }
    );

    expect(result.current).toMatchObject({
      caption: 'Compared to Previous period',
      detail: '0.9 selected · 0.7 reference · 63% coverage · 16 executions',
    });
  });

  it('reports reference query failures and missing values without changing primary data', () => {
    const { compare, metric } = createMetric();
    const primaryData = panelData([0.9]);
    jest.mocked(useDashboardPanelQuery).mockImplementation((definition) =>
      definition.id === metric.definition.id
        ? queryResult({
            ...panelData(),
            state: LoadingState.Error,
            error: new Error('reference failed'),
          })
        : queryResult(panelData([0.8, 0.9]))
    );

    const { result } = renderHook(
      () => useHeaderMetricComparison({ metric, primaryData, primaryValue: 0.9 }),
      { wrapper }
    );

    expect(result.current).toEqual({ state: 'unavailable', message: 'Comparison unavailable' });
    expect(primaryData.series[0]?.fields[1]?.values).toEqual([0.9]);
    expect(compare).not.toHaveBeenCalled();

    jest.mocked(useDashboardPanelQuery).mockReturnValue(queryResult(panelData()));
    const missing = renderHook(
      () => useHeaderMetricComparison({ metric, primaryData, primaryValue: 0.9 }),
      { wrapper }
    );
    expect(missing.result.current).toEqual({
      state: 'unavailable',
      message: 'No Previous period data for Generic metric',
    });
  });

  it.each([
    [{ status: 'checking' } as const, { state: 'loading' }],
    [{ status: 'outside-retention' } as const, { state: 'unavailable', message: 'Comparison is outside retention' }],
    [{ status: 'no-retained-executions' } as const, { state: 'unavailable', message: 'No retained executions' }],
    [{ status: 'query-error' } as const, { state: 'unavailable', message: 'Comparison unavailable' }],
  ])('maps explicit availability %o and leaves metric queries disabled', (displayAvailability, expected) => {
    const { metric } = createMetric();
    jest.mocked(useDashboardComparison).mockReturnValue(
      comparisonValue({ displayAvailability })
    );

    const { result } = renderHook(
      () => useHeaderMetricComparison({ metric, primaryData: panelData([0.9]), primaryValue: 0.9 }),
      { wrapper }
    );

    expect(result.current).toEqual(expected);
    expect(jest.mocked(useDashboardPanelQuery).mock.calls.every(([, options]) => options?.enabled === false)).toBe(true);
  });
});
