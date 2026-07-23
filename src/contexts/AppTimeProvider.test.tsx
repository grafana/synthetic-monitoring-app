import React from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';

import { AppTimeProvider, useAppTime } from './AppTimeProvider';

jest.mock('hooks/useFeatureFlag', () => ({
  useFeatureFlag: () => ({
    isEnabled: false,
    isReady: true,
  }),
}));

function TimeConsumer() {
  const { rangeMode, raw, setTimeRange, setTimezone, shiftBackward, shiftForward, zoomOut, timezone } =
    useAppTime();
  const location = useLocation();

  return (
    <div>
      <div data-testid="from">{raw.from}</div>
      <div data-testid="to">{raw.to}</div>
      <div data-testid="range-mode">{rangeMode}</div>
      <div data-testid="timezone">{timezone}</div>
      <div data-testid="search">{location.search}</div>
      <button type="button" onClick={() => setTimeRange({ from: 'now-6h', to: 'now' })}>
        set-range
      </button>
      <button type="button" onClick={() => setTimezone('utc')}>
        set-timezone
      </button>
      <button type="button" onClick={shiftBackward}>
        shift-backward
      </button>
      <button type="button" onClick={shiftForward}>
        shift-forward
      </button>
      <button type="button" onClick={zoomOut}>
        zoom-out
      </button>
    </div>
  );
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="*"
          element={
            <AppTimeProvider>
              <TimeConsumer />
            </AppTimeProvider>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('AppTimeProvider', () => {
  it('preserves whether the picker tracks now', () => {
    renderAt(`${getRoute(AppRoutes.Checks)}/1?from=now-3h&to=now`);

    expect(screen.getByTestId('range-mode')).toHaveTextContent('live');
  });

  it('treats an absolute picker range as historical even when its end is recent', () => {
    renderAt(
      `${getRoute(AppRoutes.Checks)}/1?from=${encodeURIComponent('2026-07-23T08:00:00.000Z')}&to=${encodeURIComponent('2026-07-23T11:00:00.000Z')}`
    );

    expect(screen.getByTestId('range-mode')).toHaveTextContent('historical');
  });

  it('does not rewrite the checks list URL on mount', () => {
    renderAt(getRoute(AppRoutes.Checks));

    expect(screen.getByTestId('from')).toHaveTextContent('now-3h');
  });

  it('serializes time range updates onto participating routes', async () => {
    const user = userEvent.setup();
    renderAt(`${getRoute(AppRoutes.Checks)}/1`);

    await user.click(screen.getByRole('button', { name: 'set-range' }));

    expect(screen.getByTestId('from')).toHaveTextContent('now-6h');
  });

  it('serializes timezone updates onto participating routes', async () => {
    const user = userEvent.setup();
    renderAt(`${getRoute(AppRoutes.Checks)}/1`);

    await user.click(screen.getByRole('button', { name: 'set-timezone' }));

    expect(screen.getByTestId('timezone')).toHaveTextContent('utc');
    expect(screen.getByTestId('search').textContent).toContain('timezone=utc');
  });

  it('shifts and zooms absolute ranges through the time navigation API', async () => {
    const user = userEvent.setup();
    renderAt(
      `${getRoute(AppRoutes.Checks)}/1?from=${encodeURIComponent('2020-01-01T04:00:00.000Z')}&to=${encodeURIComponent('2020-01-01T08:00:00.000Z')}`
    );

    await user.click(screen.getByRole('button', { name: 'shift-backward' }));

    expect(screen.getByTestId('from')).toHaveTextContent('2020-01-01T02:00:00.000Z');
    expect(screen.getByTestId('to')).toHaveTextContent('2020-01-01T06:00:00.000Z');

    await user.click(screen.getByRole('button', { name: 'zoom-out' }));

    expect(screen.getByTestId('from')).toHaveTextContent('2020-01-01T00:00:00.000Z');
    expect(screen.getByTestId('to')).toHaveTextContent('2020-01-01T08:00:00.000Z');
  });

  it('does not shift forward past now', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T08:00:00.000Z'));

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderAt(
      `${getRoute(AppRoutes.Checks)}/1?from=${encodeURIComponent('2020-01-01T04:00:00.000Z')}&to=${encodeURIComponent('2020-01-01T08:00:00.000Z')}`
    );

    await user.click(screen.getByRole('button', { name: 'shift-forward' }));

    expect(screen.getByTestId('from')).toHaveTextContent('2020-01-01T04:00:00.000Z');
    expect(screen.getByTestId('to')).toHaveTextContent('2020-01-01T08:00:00.000Z');

    jest.useRealTimers();
  });

  it('carries time state into dashboard links', async () => {
    function LinkConsumer() {
      const { buildDashboardPath, setTimeRange } = useAppTime();

      return (
        <>
          <button type="button" onClick={() => setTimeRange({ from: 'now-12h', to: 'now' })}>
            set-range
          </button>
          <a data-testid="dashboard-link" href={buildDashboardPath(42)}>
            dashboard
          </a>
        </>
      );
    }

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={[getRoute(AppRoutes.Checks)]}>
        <Routes>
          <Route
            path="*"
            element={
              <AppTimeProvider>
                <LinkConsumer />
              </AppTimeProvider>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'set-range' }));

    expect(screen.getByTestId('dashboard-link')).toHaveAttribute('href', expect.stringContaining('from=now-12h'));
  });
});
