import React, { PropsWithChildren } from 'react';
import { renderHook } from '@testing-library/react';

import {
  DashboardAnnotationsContextValue,
  DashboardAnnotationsStaticProvider,
  useDashboardAlertEpisodes,
} from './DashboardAnnotationsProvider';

const firingEpisodes = [
  { alertName: 'ProbeFailedExecutionsTooHigh', from: 100, to: 200 },
  { alertName: 'HTTPRequestDurationTooHighAvg', from: 300, to: 400 },
];

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

describe('useDashboardAlertEpisodes', () => {
  it('returns matching alert episodes even when the visual annotation layer is disabled', () => {
    const { result } = renderHook(() => useDashboardAlertEpisodes('ProbeFailedExecutionsTooHigh'), {
      wrapper: Wrapper,
    });

    expect(result.current).toEqual([{ alertName: 'ProbeFailedExecutionsTooHigh', from: 100, to: 200 }]);
  });

  it('can restrict matching episodes to one annotation layer', () => {
    const { result } = renderHook(
      () => useDashboardAlertEpisodes('ProbeFailedExecutionsTooHigh', 'Show alerts pending'),
      { wrapper: Wrapper }
    );

    expect(result.current).toEqual([]);
  });
});
