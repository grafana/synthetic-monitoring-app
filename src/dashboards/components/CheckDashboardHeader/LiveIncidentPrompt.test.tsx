import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAppTime } from 'contexts/AppTimeProvider';
import { type AppTimeRangeMode, DEFAULT_APP_TIME_RANGE } from 'contexts/AppTimeProvider.utils';

import { resolveCheckHealth } from './health/checkHealth';
import { CheckHealthProvider } from './health/CheckHealthContext';
import { LiveIncidentPrompt } from './LiveIncidentPrompt';

jest.mock('contexts/AppTimeProvider', () => ({
  useAppTime: jest.fn(),
}));

const setTimeRange = jest.fn();

function renderPrompt({
  liveIncidentCount = 1,
  rangeMode = 'historical',
}: {
  liveIncidentCount?: number;
  rangeMode?: AppTimeRangeMode;
} = {}) {
  jest.mocked(useAppTime).mockReturnValue({
    absolute: { from: 0, to: 1_000 },
    raw: { from: 'now-6h', to: 'now-3h' },
    rangeMode,
    timezone: 'browser',
    setTimeRange,
    setTimezone: jest.fn(),
    setRefresh: jest.fn(),
    refreshNow: jest.fn(),
    shiftBackward: jest.fn(),
    shiftForward: jest.fn(),
    zoomOut: jest.fn(),
    buildDashboardPath: jest.fn(),
    subscribeRefresh: jest.fn(() => jest.fn()),
  });
  const model = resolveCheckHealth({
    metricIds: [],
    evidence: [],
    liveIncidentCount,
    rangeMode,
    evaluationAt: 1_000,
  });

  return render(
    <CheckHealthProvider value={model}>
      <LiveIncidentPrompt />
    </CheckHealthProvider>
  );
}

describe('LiveIncidentPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a current incident separately from historical health', async () => {
    const user = userEvent.setup();

    renderPrompt({ liveIncidentCount: 1 });

    expect(screen.getByRole('status', { name: 'Current incident' })).toHaveTextContent(
      'An alert is firing now'
    );
    await user.click(screen.getByRole('button', { name: 'View current activity' }));
    expect(setTimeRange).toHaveBeenCalledWith(DEFAULT_APP_TIME_RANGE);
  });

  it('renders nothing without a live incident', () => {
    renderPrompt({ liveIncidentCount: 0 });

    expect(screen.queryByRole('status', { name: 'Current incident' })).not.toBeInTheDocument();
  });

  it('renders nothing when the selected range tracks now', () => {
    renderPrompt({ liveIncidentCount: 1, rangeMode: 'live' });

    expect(screen.queryByRole('status', { name: 'Current incident' })).not.toBeInTheDocument();
  });
});
