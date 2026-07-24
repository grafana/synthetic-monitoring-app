import { FieldType, LoadingState, type PanelData } from '@grafana/data';
import { renderHook, waitFor } from '@testing-library/react';
import {
  type DashboardPanelDefinition,
  useDashboardPanelQuery,
} from 'dashboards/hooks/useDashboardPanelQuery';

import { useAutoComparisonReference } from './useAutoComparisonReference';

jest.mock('dashboards/hooks/useDashboardPanelQuery', () => ({
  useDashboardPanelQuery: jest.fn(),
}));

const DAY_MS = 24 * 60 * 60 * 1000;
const primary = {
  from: Date.parse('2026-07-09T08:00:00.000Z'),
  to: Date.parse('2026-07-09T11:00:00.000Z'),
};
const definition: DashboardPanelDefinition = {
  id: 'execution-presence',
  pluginId: 'timeseries',
  fieldConfig: { defaults: {}, overrides: [] },
  options: {},
  targets: [],
};

function panelData(range: { from: number; to: number }, executionCount = 0, failed = false): PanelData {
  return {
    state: failed ? LoadingState.Error : LoadingState.Done,
    errors: failed ? [new Error('Prometheus unavailable')] : undefined,
    series:
      executionCount === 0
        ? []
        : [
            {
              fields: [
                { name: 'Time', type: FieldType.time, values: [range.from + 1] },
                { name: 'executions', type: FieldType.number, values: [executionCount] },
              ],
            },
          ],
  } as PanelData;
}

function result(data: PanelData, isLoading = false) {
  return { panelData: data, isLoading, menuItems: undefined, title: undefined };
}

describe('useAutoComparisonReference', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queries candidates sequentially and stops after the first retained execution', async () => {
    const enabledRanges: Array<{ from: number; to: number }> = [];

    jest.mocked(useDashboardPanelQuery).mockImplementation((_definition, options) => {
      const range = options!.range!;

      if (!options?.enabled) {
        return result(panelData(range));
      }

      enabledRanges.push(range);
      const shift = primary.from - range.from;

      return result(panelData(range, shift === 21 * DAY_MS ? 1 : 0));
    });

    const { result: hook } = renderHook(() =>
      useAutoComparisonReference({
        definition,
        enabled: true,
        primary,
        retryToken: 0,
        timezone: 'utc',
      })
    );

    await waitFor(() => {
      expect(hook.current.resolvedReference).toEqual({ kind: 'baseline', presetId: '21d' });
    });

    expect(enabledRanges.map((range) => (primary.from - range.from) / DAY_MS)).toEqual([30, 21]);
  });

  it('continues after query errors and reports an error only when no candidate succeeds', async () => {
    jest.mocked(useDashboardPanelQuery).mockImplementation((_definition, options) => {
      const range = options!.range!;

      return result(panelData(range, 0, Boolean(options?.enabled && primary.from - range.from === 30 * DAY_MS)));
    });

    const { result: hook } = renderHook(() =>
      useAutoComparisonReference({
        definition,
        enabled: true,
        primary,
        retryToken: 0,
        timezone: 'utc',
      })
    );

    await waitFor(() => {
      expect(hook.current.automaticSelection).toEqual({ status: 'query-error' });
    });
  });

  it('restarts at 30 days when retry is requested', async () => {
    const enabledShifts: number[] = [];

    jest.mocked(useDashboardPanelQuery).mockImplementation((_definition, options) => {
      const range = options!.range!;

      if (options?.enabled) {
        enabledShifts.push((primary.from - range.from) / DAY_MS);
      }

      return result(panelData(range));
    });

    const { result: hook, rerender } = renderHook(
      ({ retryToken }) =>
        useAutoComparisonReference({
          definition,
          enabled: true,
          primary,
          retryToken,
          timezone: 'utc',
        }),
      { initialProps: { retryToken: 0 } }
    );

    await waitFor(() => {
      expect(hook.current.automaticSelection).toEqual({ status: 'no-data' });
    });

    rerender({ retryToken: 1 });

    await waitFor(() => {
      expect(enabledShifts.filter((shift) => shift === 30)).toHaveLength(2);
    });
  });
});
