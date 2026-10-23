import React from 'react';
import {
  createTheme,
  FieldType,
  getDisplayProcessor,
  LoadingState,
  ThemeContext,
  ThresholdsMode,
  toDataFrame,
} from '@grafana/data';
import { TableCellBackgroundDisplayMode, TableCellDisplayMode } from '@grafana/schema';
import { TableNG } from '@grafana/ui/unstable';
import { renderHook, screen, waitFor } from '@testing-library/react';
import { CHECK_IN_FORBIDDEN_FOLDER, CHECK_IN_PRODUCTION } from 'test/fixtures/folderChecks';
import { apiRoute } from 'test/handlers';
import { createWrapper, render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles, runTestAsRBACReader } from 'test/utils';

import { FeatureName } from 'types';
import { useCheckFolderAccess } from 'hooks/useCheckFolderAccess';
import { getMetricValueMappings } from 'scenes/Common/metricValueMappings';

import { filterChecksById } from './SummaryTableViz.utils';

describe('summary metric placeholders', () => {
  const theme = createTheme();
  const display = (state?: LoadingState) =>
    getDisplayProcessor({
      theme,
      field: {
        name: 'reachability',
        type: FieldType.number,
        values: [],
        config: {
          unit: 'percentunit',
          mappings: getMetricValueMappings(state),
          thresholds: {
            mode: ThresholdsMode.Absolute,
            steps: [
              { value: -Infinity, color: 'red' },
              { value: 0.99, color: 'green' },
            ],
          },
        },
      },
    });

  it.each([undefined, LoadingState.NotStarted, LoadingState.Loading, LoadingState.Streaming])(
    'shows a neutral loading placeholder while query state is %s',
    (state) => {
      expect(display(state)(NaN)).toMatchObject({
        text: 'Loading...',
        color: theme.visualization.getColorByName('gray'),
      });
    }
  );

  it.each([LoadingState.Done, LoadingState.Error])('does not imply loading after %s', (state) => {
    for (const value of [null, undefined, NaN]) {
      expect(display(state)(value)).toMatchObject({
        text: 'N/A',
        color: theme.visualization.getColorByName('gray'),
      });
    }
  });

  it.each([Infinity, -Infinity])('keeps %s visible, including during refresh', (value) => {
    for (const state of [LoadingState.Loading, LoadingState.Done]) {
      expect(display(state)(value)).toMatchObject({ numeric: value, text: expect.stringMatching(/∞|Infinity/) });
    }
  });

  it('preserves real zero and healthy values, including during refresh', () => {
    for (const state of [LoadingState.Loading, LoadingState.Done]) {
      expect(display(state)(0)).toMatchObject({ numeric: 0, color: theme.visualization.getColorByName('red') });
      expect(display(state)(1)).toMatchObject({ numeric: 1, color: theme.visualization.getColorByName('green') });
    }
  });
});

describe('table placeholder backgrounds', () => {
  it.each(['dark', 'light'] as const)('renders readable placeholders without a fill in the %s theme', async (mode) => {
    const theme = createTheme({ colors: { mode } });
    const frame = toDataFrame({
      fields: [TableCellBackgroundDisplayMode.Basic, TableCellBackgroundDisplayMode.Gradient].map((backgroundMode) => ({
        name: backgroundMode,
        type: FieldType.number,
        values: [null, NaN, 0, 1],
        config: {
          mappings: getMetricValueMappings(LoadingState.Done, 'transparent'),
          thresholds: {
            mode: ThresholdsMode.Absolute,
            steps: [
              { value: -Infinity, color: 'red' },
              { value: 1, color: 'green' },
            ],
          },
          custom: { cellOptions: { type: TableCellDisplayMode.ColorBackground, mode: backgroundMode } },
        },
      })),
    });
    for (const field of frame.fields) {
      field.display = getDisplayProcessor({ field, theme });
    }

    render(
      <ThemeContext.Provider value={theme}>
        <TableNG data={frame} width={600} height={300} enableVirtualization={false} />
      </ThemeContext.Provider>
    );

    const placeholders = await screen.findAllByRole('gridcell', { name: 'N/A' });
    expect(placeholders).toHaveLength(4);
    for (const cell of placeholders) {
      expect(cell).toHaveStyle({ color: mode === 'dark' ? 'rgb(247, 248, 250)' : 'rgb(32, 34, 38)' });
      expect(cell.style.background).toMatch(/transparent|rgba\(\d+, \d+, \d+, 0\)/);
    }

    // Missing data must not remove the red/green backgrounds from real readings in the same column.
    for (const value of ['0', '1']) {
      for (const cell of screen.getAllByRole('gridcell', { name: value })) {
        expect(cell.style.background).not.toMatch(/transparent|rgba\(\d+, \d+, \d+, 0\)/);
        expect(cell.style.background).not.toBe('');
      }
    }
  });
});

const checks = [CHECK_IN_PRODUCTION, CHECK_IN_FORBIDDEN_FOLDER];
const frame = toDataFrame({
  fields: [
    { name: 'id', values: checks.map((check) => check.id) },
    { name: 'job', values: checks.map((check) => check.job) },
    { name: 'latency', values: [10, 20] },
  ],
});

describe('summary table folder visibility', () => {
  beforeEach(() => {
    runTestAsRBACReader();
    mockFeatureToggles({ [FeatureName.Folders]: true });
  });

  function useVisibleRows() {
    const { visibleChecks, isResolving } = useCheckFolderAccess(checks);
    const ids = new Set(isResolving ? [] : visibleChecks.map((check) => String(check.id)));
    return filterChecksById([frame], ids)[0];
  }

  it('shows only checks in accessible folders', async () => {
    const { result } = renderHook(useVisibleRows, { wrapper: createWrapper().Wrapper });
    await waitFor(() => expect(result.current.fields[1].values).toEqual([CHECK_IN_PRODUCTION.job]));
    expect(result.current.fields[2].values).toEqual([10]);
    expect(result.current.length).toBe(1);
  });

  it('preserves visibility when folders are disabled', async () => {
    mockFeatureToggles({ [FeatureName.Folders]: false });
    const { result } = renderHook(useVisibleRows, { wrapper: createWrapper().Wrapper });
    await waitFor(() => expect(result.current.length).toBe(2));
  });

  it('preserves legacy visibility when the default folder cannot be accessed', async () => {
    server.use(apiRoute('getFolder', { result: () => ({ status: 403, json: { message: 'Access denied' } }) }));
    const { result } = renderHook(useVisibleRows, { wrapper: createWrapper().Wrapper });
    await waitFor(() => expect(result.current.length).toBe(2));
  });

  it('hides all rows when no checks are accessible, including frames without IDs', () => {
    expect(filterChecksById([frame], new Set())[0].length).toBe(0);
    const unidentified = toDataFrame({ fields: [{ name: 'job', values: ['Hidden'] }] });
    expect(filterChecksById([unidentified], new Set(['200']))[0].length).toBe(0);
  });

  it('matches string IDs and leaves the original query data unchanged', () => {
    const data = toDataFrame({ fields: [{ name: 'id', values: ['200', '203'] }] });
    expect(filterChecksById([data], new Set(['203']))[0].fields[0].values).toEqual(['203']);
    expect(data.length).toBe(2);
    expect(data.fields[0].values).toEqual(['200', '203']);
  });
});
