import { createDataFrame, LoadingState, PanelData } from '@grafana/data';

import { formatDateFromNow, formatPercent, formatSeconds, selectNumericValue } from './headerMetricValue';

function createPanelData(series: PanelData['series'], state = LoadingState.Done): PanelData {
  return {
    state,
    series,
    timeRange: {} as PanelData['timeRange'],
  };
}

describe('selectNumericValue', () => {
  it('selects the last finite numeric value from the requested refId', () => {
    const panelData = createPanelData([
      createDataFrame({ refId: 'A', fields: [{ name: 'value', values: [1, 2] }] }),
      createDataFrame({ refId: 'B', fields: [{ name: 'value', values: [0.9, Number.NaN, 0.9872] }] }),
    ]);

    expect(selectNumericValue(panelData, 'B')).toBe(0.9872);
  });

  it('returns null for errors, empty frames, and non-finite values', () => {
    const errorData = createPanelData([], LoadingState.Error);
    const invalidData = createPanelData([
      createDataFrame({ refId: 'A', fields: [{ name: 'value', values: [Number.NaN, Number.POSITIVE_INFINITY] }] }),
    ]);

    expect(selectNumericValue(errorData, 'A')).toBeNull();
    expect(selectNumericValue(invalidData, 'A')).toBeNull();
    expect(selectNumericValue(createPanelData([]), 'A')).toBeNull();
  });
});

describe('header metric formatters', () => {
  it('formats percent-unit values with two decimals', () => {
    expect(formatPercent(0.9872)).toBe('98.72%');
    expect(formatPercent(null)).toBe('N/A');
  });

  it('formats seconds and handles missing values', () => {
    expect(formatSeconds(0.184)).toBe('0.18 s');
    expect(formatSeconds(null)).toBe('N/A');
  });

  it('formats a future epoch offset as an ISO-like date', () => {
    expect(formatDateFromNow(86_400, Date.UTC(2026, 6, 21))).toBe('2026-07-22');
    expect(formatDateFromNow(null, Date.UTC(2026, 6, 21))).toBeUndefined();
  });
});
