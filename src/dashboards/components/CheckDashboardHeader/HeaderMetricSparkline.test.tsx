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
    }: {
      config: { color: { fixedColor?: string } };
    }) => (
      <div
        data-color={config.color.fixedColor}
        data-testid="configured-header-metric-sparkline"
      />
    ),
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

  constructor(private readonly callback: ResizeObserverCallback) {
    ControlledResizeObserver.instances.push(this);
  }

  disconnect() {}

  observe() {
    this.emit(160);
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

describe('HeaderMetricSparkline', () => {
  beforeEach(() => {
    ControlledResizeObserver.instances = [];
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

  it('renders the current range against a labelled horizontal Normal band', () => {
    const { result } = renderHook<GrafanaTheme2, undefined>(useTheme2);
    const visual: HeaderMetricComparisonVisual = {
      kind: 'normal-band',
      lower: 0.5,
      median: 0.6,
      upper: 0.7,
      label: 'Normal',
    };

    render(<HeaderMetricSparkline sparkline={sparkline} state="unhealthy" visual={visual} />);

    const comparison = screen.getByRole('group', { name: 'Current range with Normal band' });
    const band = screen.getByTestId('header-metric-normal-band');
    const current = screen.getByTestId('header-metric-current-line');
    const svg = comparison.querySelector('svg');

    expect(screen.getByText('Current range, solid line')).toBeInTheDocument();
    expect(screen.getByText('Normal band')).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('viewBox', '0 0 160 36');
    expect(band).toHaveAttribute('x', '0');
    expect(band).toHaveAttribute('width', '160');
    expect(Number(band.getAttribute('height'))).toBeGreaterThan(0);
    expect(current).toHaveAttribute('stroke', result.current.colors.error.text);
    expect(current).not.toHaveAttribute('stroke-dasharray');
    expect(screen.queryByTestId('configured-header-metric-sparkline')).not.toBeInTheDocument();
  });

  it('renders elapsed-time-aligned labelled current and dashed reference lines', () => {
    const { result } = renderHook<GrafanaTheme2, undefined>(useTheme2);
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
      name: 'Current range compared with Previous period',
    });
    const current = screen.getByTestId('header-metric-current-line');
    const reference = screen.getByTestId('header-metric-reference-line');

    expect(screen.getByText('Current range, solid line')).toBeInTheDocument();
    expect(screen.getByText('Previous period, dashed line')).toBeInTheDocument();
    expect(comparison.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(current).toHaveAttribute('stroke', result.current.colors.success.text);
    expect(current).not.toHaveAttribute('stroke-dasharray');
    expect(reference).toHaveAttribute('stroke', result.current.colors.text.secondary);
    expect(reference).toHaveAttribute('stroke-dasharray');
    expect(current.getAttribute('points')).toMatch(/^0,/);
    expect(current.getAttribute('points')).toMatch(/160,/);
    expect(reference.getAttribute('points')).toMatch(/^0,/);
    expect(reference.getAttribute('points')).toMatch(/160,/);
    const legend = screen.getByTestId('header-metric-comparison-legend');
    expect(legend).toHaveTextContent('Current rangePrevious period');
    expect(legend).not.toHaveStyle({ pointerEvents: 'none' });
    expect(screen.getByTestId('header-metric-current-legend-line')).toHaveAttribute(
      'data-line-style',
      'solid'
    );
    expect(screen.getByTestId('header-metric-reference-legend-line')).toHaveAttribute(
      'data-line-style',
      'dashed'
    );
    expect(screen.getByTitle('Current range')).toBeVisible();
    expect(screen.getByTitle('Previous period')).toBeVisible();

    act(() => ControlledResizeObserver.instances[0]!.emit(80));

    expect(comparison.querySelector('svg')).toHaveAttribute('viewBox', '0 0 80 36');
    expect(screen.getByTitle('Current range')).toBeInTheDocument();
    expect(screen.getByTitle('Previous period')).toBeInTheDocument();
  });

  it('updates SVG geometry when ResizeObserver reports a new width', () => {
    render(
      <HeaderMetricSparkline
        sparkline={sparkline}
        state="healthy"
        visual={{ kind: 'normal-band', lower: 0.5, median: 0.6, upper: 0.7, label: 'Normal' }}
      />
    );

    const comparison = screen.getByRole('group', { name: 'Current range with Normal band' });
    const svg = comparison.querySelector('svg');
    const band = screen.getByTestId('header-metric-normal-band');

    expect(svg).toHaveAttribute('viewBox', '0 0 160 36');
    expect(band).toHaveAttribute('width', '160');

    act(() => ControlledResizeObserver.instances[0]!.emit(240));

    expect(svg).toHaveAttribute('viewBox', '0 0 240 36');
    expect(band).toHaveAttribute('width', '240');
    expect(screen.getByTestId('header-metric-current-line').getAttribute('points')).toMatch(/240,/);
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

    const currentXs = screen
      .getByTestId('header-metric-current-line')
      .getAttribute('points')!
      .split(' ')
      .map((point) => Number(point.split(',')[0]));
    const referenceXs = screen
      .getByTestId('header-metric-reference-line')
      .getAttribute('points')!
      .split(' ')
      .map((point) => Number(point.split(',')[0]));

    expect(currentXs).toEqual([expect.closeTo(160 / 3), expect.closeTo((2 * 160) / 3)]);
    expect(referenceXs).toEqual([expect.closeTo(160 / 3), expect.closeTo((2 * 160) / 3)]);
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

    expect(screen.getByTestId('header-metric-current-line')).toHaveAttribute(
      'points',
      expect.stringMatching(/^40,.*120,/)
    );
    expect(screen.getByTestId('header-metric-reference-line')).toHaveAttribute(
      'points',
      expect.stringMatching(/^16,.*144,/)
    );
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

    expect(screen.getByTestId('header-metric-current-line')).toHaveAttribute(
      'points',
      '0,36 160,0'
    );
    expect(screen.getByTestId('header-metric-reference-line')).toHaveAttribute(
      'points',
      '0,18 160,18'
    );
  });

  it('filters Normal-view samples before scaling and plotting the primary series', () => {
    const current = {
      ...sparkline,
      y: { ...sparkline.y, values: [1_000, 4, 6, -1_000] },
      x: { ...sparkline.x!, values: [-1, 0, 1_000, 1_001] },
    };

    render(
      <HeaderMetricSparkline
        sparkline={current}
        state="healthy"
        visual={{ kind: 'normal-band', lower: 4, median: 5, upper: 6, label: 'Normal' }}
      />
    );

    expect(screen.getByTestId('header-metric-current-line')).toHaveAttribute(
      'points',
      '0,36 160,0'
    );
    expect(screen.getByTestId('header-metric-normal-band')).toHaveAttribute('height', '36');
  });

  it('renders a bounded minimum thickness for a flat Normal band', () => {
    render(
      <HeaderMetricSparkline
        sparkline={sparkline}
        state="healthy"
        visual={{ kind: 'normal-band', lower: 0.95, median: 0.95, upper: 0.95, label: 'Normal' }}
      />
    );

    const band = screen.getByTestId('header-metric-normal-band');
    const y = Number(band.getAttribute('y'));
    const height = Number(band.getAttribute('height'));

    expect(height).toBeGreaterThanOrEqual(2);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(y + height).toBeLessThanOrEqual(36);
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

    expect(screen.getByTestId('header-metric-current-point')).toBeInTheDocument();
    expect(screen.queryByTestId('header-metric-current-line')).not.toBeInTheDocument();
    expect(screen.getByText('Current range, filled point')).toBeInTheDocument();

    rerender(
      <HeaderMetricSparkline
        sparkline={sparkline}
        state="healthy"
        visual={{ kind: 'overlay', label: 'Previous period', series: referenceSingle }}
      />
    );

    expect(screen.getByTestId('header-metric-reference-point')).toBeInTheDocument();
    expect(screen.queryByTestId('header-metric-reference-line')).not.toBeInTheDocument();
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

    expect(screen.queryByTestId('header-metric-current-line')).not.toBeInTheDocument();
    expect(screen.queryByTestId('header-metric-current-point')).not.toBeInTheDocument();
    expect(screen.getByTestId('header-metric-reference-line')).toBeInTheDocument();
    expect(screen.getByText('Current range, no plottable samples')).toBeInTheDocument();

    rerender(
      <HeaderMetricSparkline
        sparkline={sparkline}
        state="healthy"
        visual={{ kind: 'overlay', label: 'Previous period', series: empty }}
      />
    );

    expect(screen.getByTestId('header-metric-current-line')).toBeInTheDocument();
    expect(screen.queryByTestId('header-metric-reference-line')).not.toBeInTheDocument();
    expect(screen.queryByTestId('header-metric-reference-point')).not.toBeInTheDocument();
    expect(screen.getByText('Previous period, no plottable samples')).toBeInTheDocument();
  });

  it('keeps summary-only comparisons on the primary-only renderer without a reference path', () => {
    render(<HeaderMetricSparkline sparkline={sparkline} state="degraded" visual={{ kind: 'summary-only' }} />);

    expect(screen.getByTestId('configured-header-metric-sparkline')).toBeInTheDocument();
    expect(screen.queryByTestId('header-metric-reference-line')).not.toBeInTheDocument();
  });
});
