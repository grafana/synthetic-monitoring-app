import React from 'react';
import { dateTime, TimeRange } from '@grafana/data';
import { useTimeRange } from '@grafana/scenes-react';
import { render } from '@testing-library/react';
import { getGlobalTrackingProps } from 'features/tracking/globalTrackingProps';
import { TrackingTimeRangeScope } from 'features/tracking/TrackingTimeRangeScope';
import { createSMEventFactory } from 'features/tracking/utils';

jest.mock('@grafana/scenes-react', () => ({
  useTimeRange: jest.fn(),
}));

jest.mock('features/tracking/globalTrackingProps');

const trackTimeRangeProbeEvent = createSMEventFactory('test_feature')('time_range_scope_probe');

const from = dateTime('2026-08-11T00:00:00Z');
const to = dateTime('2026-08-11T03:00:00Z');

function mockTimeRange(raw: TimeRange['raw']) {
  // the component only reads the time range; the scene object in the tuple is unused
  const sceneTimeRange = jest.fn() as unknown as ReturnType<typeof useTimeRange>[1];
  jest.mocked(useTimeRange).mockReturnValue([{ from, to, raw }, sceneTimeRange]);
}

describe('TrackingTimeRangeScope', () => {
  const reportInteraction = jest.fn();

  beforeAll(() => {
    jest.requireMock('@grafana/runtime').reportInteraction = reportInteraction;
  });

  beforeEach(() => {
    jest.mocked(getGlobalTrackingProps).mockReturnValue({});
    reportInteraction.mockClear();
  });

  function getLastReportedProps() {
    return reportInteraction.mock.calls[reportInteraction.mock.calls.length - 1][1];
  }

  it('attaches the raw relative time range and its duration to events', () => {
    mockTimeRange({ from: 'now-3h', to: 'now' });
    render(<TrackingTimeRangeScope />);

    trackTimeRangeProbeEvent();

    expect(getLastReportedProps()).toEqual({
      time_range_from: 'now-3h',
      time_range_to: 'now',
      time_range_seconds: 10800,
    });
  });

  it('reports absolute time ranges as ISO strings', () => {
    mockTimeRange({ from, to });
    render(<TrackingTimeRangeScope />);

    trackTimeRangeProbeEvent();

    expect(getLastReportedProps()).toEqual({
      time_range_from: '2026-08-11T00:00:00.000Z',
      time_range_to: '2026-08-11T03:00:00.000Z',
      time_range_seconds: 10800,
    });
  });

  it('removes the time range props when unmounted', () => {
    mockTimeRange({ from: 'now-3h', to: 'now' });
    const { unmount } = render(<TrackingTimeRangeScope />);

    unmount();
    trackTimeRangeProbeEvent();

    expect(getLastReportedProps()).toEqual({});
  });
});
