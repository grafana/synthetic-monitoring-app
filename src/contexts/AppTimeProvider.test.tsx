import React from 'react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DASHBOARD_URL_KEYS, LEGACY_SCENE_DASHBOARD_KEYS } from 'routing/dashboardUrlSchema';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';

import { AppTimeProvider, useAppTime } from './AppTimeProvider';

let mockSceneFreeHttpDashboard = false;

jest.mock('hooks/useFeatureFlag', () => ({
  useFeatureFlag: () => ({
    isEnabled: mockSceneFreeHttpDashboard,
    isReady: true,
  }),
}));

function TimeConsumer() {
  const {
    buildDashboardPath,
    rangeMode,
    raw,
    setTimeRange,
    setTimezone,
    shiftBackward,
    shiftForward,
    zoomOut,
    timezone,
  } = useAppTime();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div>
      <div data-testid="from">{raw.from}</div>
      <div data-testid="to">{raw.to}</div>
      <div data-testid="range-mode">{rangeMode}</div>
      <div data-testid="timezone">{timezone}</div>
      <div data-testid="search">{location.search}</div>
      <a data-testid="dashboard-link" href={buildDashboardPath(42)}>
        dashboard
      </a>
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
      <button type="button" onClick={() => navigate(location.pathname)}>
        clear-url-state
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
  beforeEach(() => {
    mockSceneFreeHttpDashboard = false;
  });

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

  it('preserves comparison parameters while updating the time range', async () => {
    const user = userEvent.setup();
    renderAt(`${getRoute(AppRoutes.Checks)}/1?from=now-3h&to=now&compare=shifted&compare.preset=future-preset-id`);

    await user.click(screen.getByRole('button', { name: 'set-range' }));

    expect(screen.getByTestId('search')).toHaveTextContent('from=now-6h');
    expect(screen.getByTestId('search')).toHaveTextContent('compare=shifted');
    expect(screen.getByTestId('search')).toHaveTextContent('compare.preset=future-preset-id');
  });

  it.each([
    {
      name: 'legacy',
      canonical: false,
      comparison: 'compare=shifted&compare.preset=future-preset-id',
      fromKey: LEGACY_SCENE_DASHBOARD_KEYS.from,
    },
    {
      name: 'canonical',
      canonical: true,
      comparison: 'sm-v=1&sm-compare=shifted&sm-compare-preset=future-preset-id',
      fromKey: DASHBOARD_URL_KEYS.from,
    },
  ])(
    'does not restore a comparison cleared from a comparison-only $name URL when time changes next',
    async ({ canonical, comparison, fromKey }) => {
      mockSceneFreeHttpDashboard = canonical;
      const user = userEvent.setup();
      renderAt(`${getRoute(AppRoutes.Checks)}/1?${comparison}`);

      await user.click(screen.getByRole('button', { name: 'clear-url-state' }));
      expect(screen.getByTestId('search')).toBeEmptyDOMElement();

      await user.click(screen.getByRole('button', { name: 'set-range' }));

      const search = new URLSearchParams(screen.getByTestId('search').textContent ?? '');
      expect(search.get(fromKey)).toBe('now-6h');
      expect(screen.getByTestId('search')).not.toHaveTextContent('compare');
    }
  );

  it.each([
    {
      name: 'legacy',
      canonical: false,
      fromKey: LEGACY_SCENE_DASHBOARD_KEYS.from,
      toKey: LEGACY_SCENE_DASHBOARD_KEYS.to,
      timezoneKey: LEGACY_SCENE_DASHBOARD_KEYS.timezone,
    },
    {
      name: 'canonical',
      canonical: true,
      fromKey: DASHBOARD_URL_KEYS.from,
      toKey: DASHBOARD_URL_KEYS.to,
      timezoneKey: DASHBOARD_URL_KEYS.timezone,
    },
  ])('materializes default time fields in $name dashboard links and timezone-only writes', async ({
    canonical,
    fromKey,
    toKey,
    timezoneKey,
  }) => {
    mockSceneFreeHttpDashboard = canonical;
    const user = userEvent.setup();
    renderAt(`${getRoute(AppRoutes.Checks)}/1`);

    const linkSearch = new URL(
      screen.getByTestId('dashboard-link').getAttribute('href') ?? '',
      'http://localhost'
    ).searchParams;
    expect(linkSearch.get(fromKey)).toBe('now-3h');
    expect(linkSearch.get(toKey)).toBe('now');
    expect(linkSearch.get(timezoneKey)).toBe('browser');

    await user.click(screen.getByRole('button', { name: 'set-timezone' }));

    const writtenSearch = new URLSearchParams(screen.getByTestId('search').textContent ?? '');
    expect(writtenSearch.get(fromKey)).toBe('now-3h');
    expect(writtenSearch.get(toKey)).toBe('now');
    expect(writtenSearch.get(timezoneKey)).toBe('utc');
  });

  it('does not republish unchanged default AppTime context for an empty URL', () => {
    let renders = 0;

    function RenderCounter() {
      useAppTime();
      renders += 1;

      return null;
    }

    render(
      <MemoryRouter initialEntries={[`${getRoute(AppRoutes.Checks)}/1`]}>
        <AppTimeProvider>
          <RenderCounter />
        </AppTimeProvider>
      </MemoryRouter>
    );

    expect(renders).toBe(1);
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

  it('carries comparison-only URL state into dashboard links without exposing it through AppTime', () => {
    function LinkConsumer() {
      const { buildDashboardPath } = useAppTime();

      return (
        <a data-testid="dashboard-link" href={buildDashboardPath(42)}>
          dashboard
        </a>
      );
    }

    render(
      <MemoryRouter
        initialEntries={[`${getRoute(AppRoutes.Checks)}/1?compare=shifted&compare.preset=future-preset-id`]}
      >
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

    expect(screen.getByTestId('dashboard-link')).toHaveAttribute('href', expect.stringContaining('compare=shifted'));
    expect(screen.getByTestId('dashboard-link')).toHaveAttribute(
      'href',
      expect.stringContaining('compare.preset=future-preset-id')
    );
  });
});
