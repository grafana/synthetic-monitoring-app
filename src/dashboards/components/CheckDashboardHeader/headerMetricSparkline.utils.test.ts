import { dateTime, FieldSparkline, FieldType, LoadingState, PanelData } from '@grafana/data';

import {
  buildPolyline,
  getSparklineSamples,
  getSparklineSamplesInTimeRange,
  normalizeSparkline,
  panelDataToTrendSamples,
  selectRatioSparklineSeries,
  selectSparklineSeries,
  selectZeroBasedSparklineSeries,
} from './headerMetricSparkline.utils';

function panelData(partial: Partial<PanelData> & Pick<PanelData, 'series' | 'state'>): PanelData {
  return {
    timeRange: { from: dateTime(0), to: dateTime(1), raw: { from: dateTime(0), to: dateTime(1) } },
    ...partial,
  };
}

function sparkline(values: unknown[], times?: unknown[]): FieldSparkline {
  return {
    y: { name: 'Value', type: FieldType.number, values, config: {} },
    x: times ? { name: 'Time', type: FieldType.time, values: times, config: {} } : undefined,
    timeRange: {
      from: dateTime(0),
      to: dateTime(1),
      raw: { from: dateTime(0), to: dateTime(1) },
    },
  };
}

describe('comparison sparkline geometry', () => {
  it('keeps only finite paired time and value samples', () => {
    expect(
      getSparklineSamples(
        sparkline([1, Number.NaN, 3, 4], [Number.NaN, 1_000, 2_000, Number.POSITIVE_INFINITY])
      )
    ).toEqual([{ at: 2_000, value: 3 }]);
  });

  it('keeps display samples on both selected endpoints and excludes pre- and post-range samples', () => {
    const series = {
      ...sparkline([1, 2, 3, 4], [999, 1_000, 2_000, 2_001]),
      timeRange: {
        from: dateTime(1_000),
        to: dateTime(2_000),
        raw: { from: dateTime(1_000), to: dateTime(2_000) },
      },
    };

    expect(getSparklineSamplesInTimeRange(series)).toEqual([
      { at: 1_000, value: 2 },
      { at: 2_000, value: 3 },
    ]);
  });

  it('maps the first and last time points to the full width', () => {
    expect(normalizeSparkline(sparkline([0, 5, 10], [1_000, 1_500, 2_000]), 120, 36, 0, 10)).toEqual([
      { x: 0, y: 36 },
      { x: 60, y: 18 },
      { x: 120, y: 0 },
    ]);
  });

  it('uses a shared y range to align equal values across current and reference series', () => {
    const current = normalizeSparkline(sparkline([0, 10]), 100, 36, 0, 10);
    const reference = normalizeSparkline(sparkline([5, 10]), 100, 36, 0, 10);

    expect(current[1]?.y).toBe(reference[1]?.y);
    expect(reference[0]?.y).toBe(18);
  });

  it('maps constant series to the vertical midpoint', () => {
    expect(normalizeSparkline(sparkline([4, 4]), 100, 36, 4, 4)).toEqual([
      { x: 0, y: 18 },
      { x: 100, y: 18 },
    ]);
  });

  it('omits missing and non-finite samples', () => {
    expect(
      normalizeSparkline(
        sparkline([0, null, Number.NaN, Number.POSITIVE_INFINITY, 4], [0, 1, 2, 3, Number.NaN]),
        100,
        36,
        0,
        4
      )
    ).toEqual([{ x: 50, y: 36 }]);
  });

  it('derives elapsed bounds from valid paired samples after invalid boundaries are removed', () => {
    expect(
      normalizeSparkline(
        sparkline([Number.NaN, 2, 3, Number.NaN], [0, 1_000, 2_000, 3_000]),
        100,
        36,
        0,
        4
      )
    ).toEqual([
      { x: 0, y: 18 },
      { x: 100, y: 9 },
    ]);

    expect(
      normalizeSparkline(
        sparkline([1, 2, 3, 4], [Number.NaN, 1_000, 2_000, Number.POSITIVE_INFINITY]),
        100,
        36,
        0,
        4
      )
    ).toEqual([
      { x: 0, y: 18 },
      { x: 100, y: 9 },
    ]);
  });

  it('keeps partial edge samples positioned within the full selected time domain', () => {
    expect(
      normalizeSparkline(
        sparkline([Number.NaN, 2, 3, Number.NaN], [0, 250, 750, 1_000]),
        100,
        36,
        0,
        4,
        { min: 0, max: 1_000 }
      )
    ).toEqual([
      { x: 25, y: 18 },
      { x: 75, y: 9 },
    ]);
  });

  it("places a band's upper coordinate above its lower coordinate", () => {
    const upper = normalizeSparkline(sparkline([8, 8]), 100, 36, 0, 10);
    const lower = normalizeSparkline(sparkline([2, 2]), 100, 36, 0, 10);

    expect(upper[0]!.y).toBeLessThan(lower[0]!.y);
  });

  it('builds SVG polyline coordinates', () => {
    expect(
      buildPolyline([
        { x: 0, y: 36 },
        { x: 60, y: 18 },
        { x: 120, y: 0 },
      ])
    ).toBe('0,36 60,18 120,0');
  });
});

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

  it('pins ratio sparklines to a 0–1 y-range so flat 100% sits at the top', () => {
    const series = selectRatioSparklineSeries(
      panelData({
        state: LoadingState.Done,
        series: [
          {
            length: 2,
            fields: [
              { name: 'Time', type: FieldType.time, values: [0, 1000], config: {} },
              { name: 'Value', type: FieldType.number, values: [1, 1], config: {} },
            ],
          },
        ],
      })
    );

    expect(series?.y.state?.range).toEqual({ min: 0, max: 1, delta: 1 });
    expect(series?.y.config).toMatchObject({ min: 0, max: 1 });
  });

  it('keeps zero visible for latency sparklines', () => {
    const series = selectZeroBasedSparklineSeries(
      panelData({
        state: LoadingState.Done,
        series: [
          {
            length: 2,
            fields: [
              { name: 'Time', type: FieldType.time, values: [0, 1000], config: {} },
              { name: 'Value', type: FieldType.number, values: [0.42, 0.47], config: {} },
            ],
          },
        ],
      })
    );

    expect(series?.y.state?.range).toEqual({ min: 0, max: 0.47, delta: 0.47 });
    expect(series?.y.config).toMatchObject({ min: 0 });
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
