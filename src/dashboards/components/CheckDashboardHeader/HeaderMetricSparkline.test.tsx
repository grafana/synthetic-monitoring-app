import React from 'react';
import {
  dateTime,
  FieldSparkline,
  FieldType,
  GrafanaTheme2,
} from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import { act, render, renderHook, screen } from '@testing-library/react';

import { HeaderMetricSparkline } from './HeaderMetricSparkline';
import type { HeaderMetricComparisonVisual } from './useHeaderMetricComparison';

jest.mock('@grafana/ui', () => {
  const actual = jest.requireActual('@grafana/ui');

  return {
    ...actual,
    Sparkline: ({
      config,
      sparkline,
    }: {
      config: {
        color: { fixedColor?: string };
        custom?: { fillOpacity?: number; lineWidth?: number };
      };
      sparkline: FieldSparkline;
    }) => (
      <div
        data-color={config.color.fixedColor}
        data-fill-opacity={config.custom?.fillOpacity}
        data-line-width={config.custom?.lineWidth}
        data-range-max={sparkline.y.state?.range?.max}
        data-range-min={sparkline.y.state?.range?.min}
        data-testid="configured-header-metric-sparkline"
        data-x-values={JSON.stringify(Array.from(sparkline.x?.values ?? []))}
        data-y-values={JSON.stringify(Array.from(sparkline.y.values))}
      />
    ),
    UPlotChart: ({
      config,
      data,
      height,
      width,
    }: {
      config: {
        getConfig: () => {
          mode?: number;
          scales?: Record<string, { range?: () => [number, number] }>;
          series?: Array<{ dash?: number[]; fill?: unknown } | null>;
        };
      };
      data: unknown[];
      height: number;
      width: number;
    }) => {
      const plotConfig = config.getConfig();
      const yRange = plotConfig.scales?.y?.range?.();

      return (
        <div
          data-height={height}
          data-mode={plotConfig.mode}
          data-plot-data={JSON.stringify(data)}
          data-primary-has-fill={Boolean(plotConfig.series?.[1]?.fill)}
          data-reference-dash={JSON.stringify(plotConfig.series?.[2]?.dash)}
          data-testid="configured-comparison-uplot"
          data-width={width}
          data-y-range={JSON.stringify(yRange)}
        />
      );
    },
  };
});

const sparkline: FieldSparkline = {
  y: {
    name: 'Value',
    type: FieldType.number,
    values: [0.9, 1],
    config: {},
  },
  x: {
    name: 'Time',
    type: FieldType.time,
    values: [0, 1_000],
    config: {},
  },
  timeRange: {
    from: dateTime(0),
    to: dateTime(1_000),
    raw: { from: dateTime(0), to: dateTime(1_000) },
  },
};

class ControlledResizeObserver implements ResizeObserver {
  static instances: ControlledResizeObserver[] = [];
  static emitOnObserve = true;

  constructor(private readonly callback: ResizeObserverCallback) {
    ControlledResizeObserver.instances.push(this);
  }

  disconnect() {}

  observe() {
    if (ControlledResizeObserver.emitOnObserve) {
      this.emit(160);
    }
  }

  emit(width: number) {
    this.callback(
      [{ contentRect: { width } } as ResizeObserverEntry],
      this
    );
  }

  takeRecords() {
    return [];
  }

  unobserve() {}
}

type ComparisonPlotData = [
  null,
  [number[], Array<number | null>],
  [number[], Array<number | null>],
];

function getComparisonPlotData(): ComparisonPlotData {
  return JSON.parse(
    screen.getByTestId('configured-comparison-uplot').getAttribute('data-plot-data')!
  ) as ComparisonPlotData;
}

describe('HeaderMetricSparkline', () => {
  beforeEach(() => {
    ControlledResizeObserver.instances = [];
    ControlledResizeObserver.emitOnObserve = true;
    global.ResizeObserver = ControlledResizeObserver;
  });

  it.each([
    ['healthy', 'success'],
    ['degraded', 'warning'],
    ['unhealthy', 'error'],
    ['unknown', 'text'],
  ] as const)('uses the selected-range %s colour', (state, tone) => {
    const { result } = renderHook<GrafanaTheme2, undefined>(useTheme2);

    render(<HeaderMetricSparkline sparkline={sparkline} state={state} />);

    const expectedColor =
      tone === 'text'
        ? result.current.colors.text.primary
        : result.current.colors[tone].text;
    expect(screen.getByTestId('configured-header-metric-sparkline')).toHaveAttribute(
      'data-color',
      expectedColor
    );
  });

  it('uses the neutral secondary colour without a health model', () => {
    const { result } = renderHook<GrafanaTheme2, undefined>(useTheme2);

    render(<HeaderMetricSparkline sparkline={sparkline} />);

    expect(screen.getByTestId('configured-header-metric-sparkline')).toHaveAttribute(
      'data-color',
      result.current.colors.text.secondary
    );
  });

  it('renders current and reference facets in one responsive uPlot chart', () => {
    const visual: HeaderMetricComparisonVisual = {
      kind: 'overlay',
      label: 'Previous period',
      series: {
        ...sparkline,
        y: { ...sparkline.y, values: [0, 0.5] },
        x: { ...sparkline.x!, values: [10_000, 11_000] },
        timeRange: {
          from: dateTime(10_000),
          to: dateTime(11_000),
          raw: { from: dateTime(10_000), to: dateTime(11_000) },
        },
      },
    };

    render(<HeaderMetricSparkline sparkline={sparkline} state="healthy" visual={visual} />);

    const comparison = screen.getByRole('group', {
      name: 'Current range compared to Previous period',
    });
    const plot = screen.getByTestId('configured-comparison-uplot');

    expect(screen.getByText('Current range, solid line')).toBeInTheDocument();
    expect(screen.getByText('Previous period, dashed line')).toBeInTheDocument();
    expect(plot).toHaveAttribute('data-mode', '2');
    expect(plot).toHaveAttribute('data-width', '160');
    expect(plot).toHaveAttribute(
      'data-plot-data',
      '[null,[[0,1],[0.9,1]],[[0,1],[0,0.5]]]'
    );
    expect(plot).toHaveAttribute('data-primary-has-fill', 'true');
    expect(plot).toHaveAttribute('data-reference-dash', '[4,3]');
    expect(screen.queryByTestId('configured-header-metric-sparkline')).not.toBeInTheDocument();
    expect(comparison.querySelector('svg')).not.toBeInTheDocument();
    expect(screen.queryByTestId('header-metric-comparison-legend')).not.toBeInTheDocument();

    act(() => ControlledResizeObserver.instances[0]!.emit(80));

    expect(plot).toHaveAttribute('data-width', '80');
  });

  it('preserves a fixed 0–1 primary range while plotting the comparison on the same scale', () => {
    const ratioSparkline = {
      ...sparkline,
      y: {
        ...sparkline.y,
        config: { ...sparkline.y.config, min: 0, max: 1 },
        values: [0.9, 1],
        state: { range: { min: 0, max: 1, delta: 1 } },
      },
    };

    render(
      <HeaderMetricSparkline
        sparkline={ratioSparkline}
        state="healthy"
        visual={{
          kind: 'baseline-average',
          label: 'Last 30 days average',
          value: 0.95,
        }}
      />
    );

    const plot = screen.getByTestId('configured-comparison-uplot');
    expect(plot).toHaveAttribute('data-y-range', '[0,1]');
    expect(plot).toHaveAttribute(
      'data-plot-data',
      '[null,[[0,1],[0.9,1]],[[0,1],[0.95,0.95]]]'
    );
  });

  it('renders a baseline average as a dashed horizontal reference line', () => {
    render(
      <HeaderMetricSparkline
        sparkline={sparkline}
        state="healthy"
        visual={{
          kind: 'baseline-average',
          label: 'Last 14 days average',
          value: 0.95,
        }}
      />
    );

    const comparison = screen.getByRole('group', {
      name: 'Current range compared to Last 14 days average',
    });
    const plot = screen.getByTestId('configured-comparison-uplot');
    expect(plot).toHaveAttribute(
      'data-plot-data',
      '[null,[[0,1],[0.9,1]],[[0,1],[0.95,0.95]]]'
    );
    expect(plot).toHaveAttribute('data-reference-dash', '[4,3]');
    expect(screen.getByText('Last 14 days average, dashed line')).toBeInTheDocument();
    expect(comparison.querySelector('svg')).not.toBeInTheDocument();
    expect(screen.queryByTestId('header-metric-comparison-legend')).not.toBeInTheDocument();
  });

  it('retries the initial measurement when layout is not ready before ResizeObserver notifies', () => {
    ControlledResizeObserver.emitOnObserve = false;
    const deferredMeasurements: FrameRequestCallback[] = [];
    jest
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValueOnce({ width: 0 } as DOMRect)
      .mockReturnValueOnce({ width: 0 } as DOMRect)
      .mockReturnValue({ width: 160 } as DOMRect);
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      deferredMeasurements.push(callback);
      return deferredMeasurements.length;
    });

    render(
      <HeaderMetricSparkline
        sparkline={sparkline}
        state="healthy"
        visual={{ kind: 'overlay', label: 'Previous period', series: sparkline }}
      />
    );

    expect(deferredMeasurements).toHaveLength(1);

    act(() => deferredMeasurements.shift()!(0));
    expect(deferredMeasurements).toHaveLength(1);

    act(() => deferredMeasurements.shift()!(16));

    expect(screen.getByTestId('configured-comparison-uplot')).toHaveAttribute('data-width', '160');
  });

  it('preserves equal elapsed positions after invalid boundary samples are removed', () => {
    const current = {
      ...sparkline,
      y: { ...sparkline.y, values: [Number.NaN, 0.9, 1, Number.NaN] },
      x: { ...sparkline.x!, values: [0, 1_000, 2_000, 3_000] },
      timeRange: {
        from: dateTime(0),
        to: dateTime(3_000),
        raw: { from: dateTime(0), to: dateTime(3_000) },
      },
    };
    const reference = {
      ...sparkline,
      y: { ...sparkline.y, values: [Number.NaN, 0, 0.5, Number.NaN] },
      x: { ...sparkline.x!, values: [10_000, 11_000, 12_000, 13_000] },
      timeRange: {
        from: dateTime(10_000),
        to: dateTime(13_000),
        raw: { from: dateTime(10_000), to: dateTime(13_000) },
      },
    };

    render(
      <HeaderMetricSparkline
        sparkline={current}
        state="healthy"
        visual={{ kind: 'overlay', label: 'Previous period', series: reference }}
      />
    );

    const [, currentFacet, referenceFacet] = getComparisonPlotData();
    expect(currentFacet[0]).toEqual([0, expect.closeTo(1 / 3), expect.closeTo(2 / 3), 1]);
    expect(currentFacet[1]).toEqual([null, 0.9, 1, null]);
    expect(referenceFacet[0]).toEqual([0, expect.closeTo(1 / 3), expect.closeTo(2 / 3), 1]);
    expect(referenceFacet[1]).toEqual([null, 0, 0.5, null]);
  });

  it('does not stretch missing edge samples across equal-duration overlays', () => {
    const current = {
      ...sparkline,
      y: { ...sparkline.y, values: [Number.NaN, 0.9, 1, Number.NaN] },
      x: { ...sparkline.x!, values: [0, 250, 750, 1_000] },
    };
    const reference = {
      ...sparkline,
      y: { ...sparkline.y, values: [Number.NaN, 0, 0.5, Number.NaN] },
      x: { ...sparkline.x!, values: [10_000, 10_100, 10_900, 11_000] },
      timeRange: {
        from: dateTime(10_000),
        to: dateTime(11_000),
        raw: { from: dateTime(10_000), to: dateTime(11_000) },
      },
    };

    render(
      <HeaderMetricSparkline
        sparkline={current}
        state="healthy"
        visual={{ kind: 'overlay', label: 'Previous period', series: reference }}
      />
    );

    const [, currentFacet, referenceFacet] = getComparisonPlotData();
    expect(currentFacet[0]).toEqual([0, 0.25, 0.75, 1]);
    expect(referenceFacet[0]).toEqual([0, 0.1, 0.9, 1]);
  });

  it('filters overlay samples to each inclusive display range before scaling and plotting', () => {
    const current = {
      ...sparkline,
      y: { ...sparkline.y, values: [1_000, 0, 10, -1_000] },
      x: { ...sparkline.x!, values: [-1, 0, 1_000, 1_001] },
    };
    const reference = {
      ...sparkline,
      y: { ...sparkline.y, values: [-1_000, 5, 5, 10_000] },
      x: { ...sparkline.x!, values: [9_999, 10_000, 11_000, 11_001] },
      timeRange: {
        from: dateTime(10_000),
        to: dateTime(11_000),
        raw: { from: dateTime(10_000), to: dateTime(11_000) },
      },
    };

    render(
      <HeaderMetricSparkline
        sparkline={current}
        state="healthy"
        visual={{ kind: 'overlay', label: 'Previous period', series: reference }}
      />
    );

    expect(screen.getByTestId('configured-comparison-uplot')).toHaveAttribute('data-y-range', '[0,10]');
    expect(screen.getByTestId('configured-comparison-uplot')).toHaveAttribute(
      'data-plot-data',
      '[null,[[0,1],[0,10]],[[0,1],[5,5]]]'
    );
  });

  it('renders visible current and reference points when either series has one valid sample', () => {
    const currentSingle = {
      ...sparkline,
      y: { ...sparkline.y, values: [Number.NaN, 0.9, Number.NaN] },
      x: { ...sparkline.x!, values: [0, 1_000, 2_000] },
    };
    const referenceSingle = {
      ...sparkline,
      y: { ...sparkline.y, values: [Number.NaN, 0.5, Number.NaN] },
      x: { ...sparkline.x!, values: [10_000, 11_000, 12_000] },
      timeRange: {
        from: dateTime(10_000),
        to: dateTime(12_000),
        raw: { from: dateTime(10_000), to: dateTime(12_000) },
      },
    };
    const visual: HeaderMetricComparisonVisual = {
      kind: 'overlay',
      label: 'Previous period',
      series: sparkline,
    };

    const { rerender } = render(
      <HeaderMetricSparkline sparkline={currentSingle} state="healthy" visual={visual} />
    );

    expect(getComparisonPlotData()[1][1]).toEqual([null, 0.9]);
    expect(screen.getByText('Current range, filled point')).toBeInTheDocument();

    rerender(
      <HeaderMetricSparkline
        sparkline={sparkline}
        state="healthy"
        visual={{ kind: 'overlay', label: 'Previous period', series: referenceSingle }}
      />
    );

    expect(getComparisonPlotData()[2][1]).toEqual([null, 0.5, null]);
    expect(screen.getByText('Previous period, hollow point')).toBeInTheDocument();
  });

  it('omits empty series marks while retaining the other comparison evidence', () => {
    const empty = {
      ...sparkline,
      y: { ...sparkline.y, values: [Number.NaN, Number.POSITIVE_INFINITY] },
    };
    const visual: HeaderMetricComparisonVisual = {
      kind: 'overlay',
      label: 'Previous period',
      series: sparkline,
    };
    const { rerender } = render(
      <HeaderMetricSparkline sparkline={empty} state="healthy" visual={visual} />
    );

    expect(getComparisonPlotData()[1][1]).toEqual([null, null]);
    expect(getComparisonPlotData()[2][1]).toEqual([0.9, 1]);
    expect(screen.getByText('Current range, no plottable samples')).toBeInTheDocument();

    rerender(
      <HeaderMetricSparkline
        sparkline={sparkline}
        state="healthy"
        visual={{ kind: 'overlay', label: 'Previous period', series: empty }}
      />
    );

    expect(getComparisonPlotData()[1][1]).toEqual([0.9, 1]);
    expect(getComparisonPlotData()[2][1]).toEqual([null, null]);
    expect(screen.getByText('Previous period, no plottable samples')).toBeInTheDocument();
  });

  it('keeps summary-only comparisons on the primary-only renderer without a reference path', () => {
    render(<HeaderMetricSparkline sparkline={sparkline} state="degraded" visual={{ kind: 'summary-only' }} />);

    expect(screen.getByTestId('header-metric-sparkline-plot')).toBeVisible();
    expect(screen.getByTestId('configured-header-metric-sparkline')).toBeInTheDocument();
    expect(screen.queryByTestId('configured-comparison-uplot')).not.toBeInTheDocument();
    expect(screen.queryByTestId('header-metric-comparison-legend')).not.toBeInTheDocument();
  });
});
