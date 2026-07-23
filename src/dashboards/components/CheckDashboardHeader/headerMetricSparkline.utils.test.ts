import { dateTime, FieldType, LoadingState, PanelData } from '@grafana/data';

import { panelDataToTrendSamples, selectSparklineSeries } from './headerMetricSparkline.utils';

function panelData(partial: Partial<PanelData> & Pick<PanelData, 'series' | 'state'>): PanelData {
  return {
    timeRange: { from: dateTime(0), to: dateTime(1), raw: { from: dateTime(0), to: dateTime(1) } },
    ...partial,
  };
}

describe('selectSparklineSeries', () => {
  it('returns a FieldSparkline when a numeric series has at least two points', () => {
    const series = selectSparklineSeries(
      panelData({
        state: LoadingState.Done,
        series: [
          {
            length: 2,
            fields: [
              { name: 'Time', type: FieldType.time, values: [0, 1000], config: {} },
              { name: 'Value', type: FieldType.number, values: [0.9, 1], config: {} },
            ],
          },
        ],
      })
    );

    expect(series?.y.values).toEqual([0.9, 1]);
    expect(series?.y.state?.range).toMatchObject({ min: 0.9, max: 1 });
    expect(series?.y.state?.range?.delta).toBeCloseTo(0.1);
    expect(series?.x?.values).toEqual([0, 1000]);
  });

  it('returns null when there are fewer than two points or the query errored', () => {
    expect(
      selectSparklineSeries(
        panelData({
          state: LoadingState.Done,
          series: [
            {
              length: 1,
              fields: [{ name: 'Value', type: FieldType.number, values: [1], config: {} }],
            },
          ],
        })
      )
    ).toBeNull();

    expect(
      selectSparklineSeries(
        panelData({
          state: LoadingState.Error,
          series: [
            {
              length: 2,
              fields: [{ name: 'Value', type: FieldType.number, values: [1, 2], config: {} }],
            },
          ],
        })
      )
    ).toBeNull();
  });
});

describe('panelDataToTrendSamples', () => {
  it('pairs, filters, combines, and sorts time-series values', () => {
    const data = panelData({
      state: LoadingState.Done,
      series: [
        {
          length: 3,
          fields: [
            { name: 'Time', type: FieldType.time, values: [3_000, 1_000, 2_000], config: {} },
            { name: 'Value', type: FieldType.number, values: [3, 1, Number.NaN], config: {} },
          ],
        },
        {
          length: 2,
          fields: [
            { name: 'Time', type: FieldType.time, values: [2_500, 1_500], config: {} },
            { name: 'Value', type: FieldType.number, values: [2.5, 1.5], config: {} },
          ],
        },
      ],
    });

    expect(panelDataToTrendSamples(data)).toEqual([
      { at: 1_000, value: 1 },
      { at: 1_500, value: 1.5 },
      { at: 2_500, value: 2.5 },
      { at: 3_000, value: 3 },
    ]);
  });

  it('returns no samples for empty or errored data', () => {
    expect(panelDataToTrendSamples(panelData({ state: LoadingState.Done, series: [] }))).toEqual([]);
    expect(
      panelDataToTrendSamples(
        panelData({
          state: LoadingState.Error,
          series: [
            {
              length: 1,
              fields: [
                { name: 'Time', type: FieldType.time, values: [1_000], config: {} },
                { name: 'Value', type: FieldType.number, values: [1], config: {} },
              ],
            },
          ],
        })
      )
    ).toEqual([]);
  });
});
