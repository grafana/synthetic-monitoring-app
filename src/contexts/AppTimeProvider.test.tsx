import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';

import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';

import { AppTimeProvider, useAppTime } from './AppTimeProvider';

function TimeConsumer() {
  const { raw, setTimeRange } = useAppTime();

  return (
    <div>
      <div data-testid="from">{raw.from}</div>
      <button type="button" onClick={() => setTimeRange({ from: 'now-6h', to: 'now' })}>
        set-range
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
