import React, { PropsWithChildren } from 'react';
import { renderHook } from '@testing-library/react';

import {
  DashboardAnnotationsContextValue,
  DashboardAnnotationsStaticProvider,
  useDashboardAlertEpisodes,
  useDashboardAlertEpisodesForTpe,
} from './DashboardAnnotationsProvider';

const firingEpisodes = [
  { alertName: 'ProbeFailedExecutionsTooHigh', from: 100, to: 200 },
  { alertName: 'HTTPRequestDurationTooHighAvg', from: 300, to: 400 },
];
const pendingEpisodes = [{ alertName: 'ProbeFailedExecutionsTooHigh', from: 500, to: 600 }];

function Wrapper({ children }: PropsWithChildren) {
  const value: DashboardAnnotationsContextValue = {
    definitions: [{ name: 'Show alerts firing', enable: true, iconColor: 'red' }],
    enabledByName: { 'Show alerts firing': false },
    framesByName: {},
    frames: [],
    eventsByName: {},
    alertEpisodesByName: { 'Show alerts firing': firingEpisodes },
    setEnabled: jest.fn(),
  };

  return <DashboardAnnotationsStaticProvider value={value}>{children}</DashboardAnnotationsStaticProvider>;
}

function TpeWrapper({ children }: PropsWithChildren) {
  const value: DashboardAnnotationsContextValue = {
    definitions: [
      { name: 'Show alerts firing', enable: true, iconColor: 'red' },
      { name: 'Show alerts pending', enable: true, iconColor: 'yellow' },
    ],
    enabledByName: { 'Show alerts firing': false, 'Show alerts pending': true },
    framesByName: {},
    frames: [],
    eventsByName: {},
    alertEpisodesByName: {
      'Show alerts firing': firingEpisodes,
      'Show alerts pending': pendingEpisodes,
    },
    setEnabled: jest.fn(),
  };

  return <DashboardAnnotationsStaticProvider value={value}>{children}</DashboardAnnotationsStaticProvider>;
}

describe('useDashboardAlertEpisodes', () => {
  it('returns matching alert episodes even when the visual annotation layer is disabled', () => {
    const { result } = renderHook(() => useDashboardAlertEpisodes('ProbeFailedExecutionsTooHigh'), {
      wrapper: Wrapper,
    });

    expect(result.current).toEqual([{ alertName: 'ProbeFailedExecutionsTooHigh', from: 100, to: 200 }]);
  });

  it('matches GRAFANA_ALERTS titles that include a period suffix', () => {
    const value: DashboardAnnotationsContextValue = {
      definitions: [{ name: 'Show alerts firing', enable: true, iconColor: 'red' }],
      enabledByName: { 'Show alerts firing': true },
      framesByName: {},
      frames: [],
      eventsByName: {},
      alertEpisodesByName: {
        'Show alerts firing': [{ alertName: 'HTTPRequestDurationTooHighAvg [5m]', from: 300, to: 400 }],
      },
      setEnabled: jest.fn(),
    };

    const { result } = renderHook(() => useDashboardAlertEpisodes('HTTPRequestDurationTooHighAvg'), {
      wrapper: ({ children }) => (
        <DashboardAnnotationsStaticProvider value={value}>{children}</DashboardAnnotationsStaticProvider>
      ),
    });

    expect(result.current).toEqual([{ alertName: 'HTTPRequestDurationTooHighAvg [5m]', from: 300, to: 400 }]);
  });

  it('can restrict matching episodes to one annotation layer', () => {
    const { result } = renderHook(
      () => useDashboardAlertEpisodes('ProbeFailedExecutionsTooHigh', 'Show alerts pending'),
      { wrapper: Wrapper }
    );

    expect(result.current).toEqual([]);
  });
});

describe('useDashboardAlertEpisodesForTpe', () => {
  it('keeps alert episodes grouped by enabled state', () => {
    const { result } = renderHook(() => useDashboardAlertEpisodesForTpe(), { wrapper: TpeWrapper });

    expect(result.current).toEqual({ firing: [], pending: pendingEpisodes });
  });
});
