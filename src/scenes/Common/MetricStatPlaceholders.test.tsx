import React from 'react';
import { createTheme, getFieldDisplayValues, LoadingState } from '@grafana/data';
import { VizConfig } from '@grafana/scenes';
import { waitFor } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';

import { AvgLatency } from './AvgLatencyViz';
import { Frequency } from './FrequencyViz';
import { ReachabilityStat } from './ReachabilityStatViz';
import { UptimeStat } from './UptimeStatViz';

const mockVizPanel = jest.fn((_props: { viz: VizConfig }) => null);
let mockLoadingState = LoadingState.Loading;

// Keep panel configuration real and exercise Grafana's no-series display path below.
jest.mock('@grafana/scenes-react', () => ({
  useQueryRunner: () => ({ useState: () => ({ data: { state: mockLoadingState, series: [] } }) }),
  useDataTransformer: () => ({ useState: () => ({ data: { state: mockLoadingState, series: [] } }) }),
  useTimeRange: () => [],
  VizPanel: (props: { viz: VizConfig }) => mockVizPanel(props),
}));

jest.mock('./useVizPanelMenu', () => ({ useVizPanelMenu: () => undefined }));

describe('check-detail stat placeholders', () => {
  it.each([
    { name: 'Uptime', element: <UptimeStat check={BASIC_HTTP_CHECK} /> },
    { name: 'Reachability', element: <ReachabilityStat check={BASIC_HTTP_CHECK} /> },
    { name: 'Average latency', element: <AvgLatency /> },
    { name: 'Frequency', element: <Frequency /> },
  ])('$name switches from loading to neutral no data when no series are returned', async ({ element }) => {
    const theme = createTheme();
    const readDisplay = () => {
      const { viz } = mockVizPanel.mock.calls.at(-1)![0];
      return getFieldDisplayValues({
        data: [],
        fieldConfig: viz.fieldConfig,
        reduceOptions: { calcs: ['lastNotNull'] },
        replaceVariables: (value) => value,
        theme,
      })[0].display;
    };

    mockLoadingState = LoadingState.Loading;
    const { rerender } = render(element);
    await waitFor(() => expect(mockVizPanel).toHaveBeenCalled());
    expect(readDisplay()).toMatchObject({ text: 'Loading...', color: theme.visualization.getColorByName('gray') });

    mockLoadingState = LoadingState.Done;
    rerender(React.cloneElement(element));
    expect(readDisplay()).toMatchObject({ text: 'N/A', color: theme.visualization.getColorByName('gray') });

    mockLoadingState = LoadingState.Error;
    rerender(React.cloneElement(element));
    expect(readDisplay()).toMatchObject({ text: 'N/A', color: theme.visualization.getColorByName('gray') });
  });
});
