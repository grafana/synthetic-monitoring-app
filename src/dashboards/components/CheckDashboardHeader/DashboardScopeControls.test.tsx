import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAppTime } from 'contexts/AppTimeProvider';
import { useCheckDashboard } from 'contexts/CheckDashboardProvider';

import { DashboardScopeControls } from './DashboardScopeControls';

jest.mock('contexts/AppTimeProvider', () => ({ useAppTime: jest.fn() }));
jest.mock('contexts/CheckDashboardProvider', () => ({ useCheckDashboard: jest.fn() }));
jest.mock('@grafana/ui', () => ({
  Stack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useStyles2: () => ({ visuallyHidden: 'visually-hidden' }),
  MultiCombobox: ({
    id,
    loading,
    maxWidth,
    minWidth,
    onChange,
    width,
  }: {
    id?: string;
    loading: boolean;
    maxWidth?: number;
    minWidth: number;
    onChange: (values: Array<{ value: string }>) => void;
    width: number | 'auto';
  }) => (
    <div
      data-loading={String(loading)}
      data-max-width={maxWidth}
      data-min-width={minWidth}
      data-testid="probe-multi-combobox"
      data-width={width}
    >
      <input id={id} role="combobox" />
      <button type="button" onClick={() => onChange([{ value: 'Paris' }, { value: 'Tokyo' }])}>
        Select probes
      </button>
      <button type="button" onClick={() => onChange([])}>
        Clear probes
      </button>
    </div>
  ),
  RefreshPicker: ({
    onIntervalChanged,
    onRefresh,
  }: {
    onIntervalChanged: (value: string) => void;
    onRefresh: () => void;
  }) => (
    <>
      <button type="button" onClick={onRefresh}>
        Refresh now
      </button>
      <button type="button" onClick={() => onIntervalChanged('1m')}>
        Set refresh
      </button>
    </>
  ),
  TimeRangePicker: ({ onChange }: { onChange: (range: { raw: { from: string; to: string } }) => void }) => (
    <button type="button" onClick={() => onChange({ raw: { from: 'now-6h', to: 'now' } })}>
      Set time range
    </button>
  ),
}));

describe('DashboardScopeControls', () => {
  it('updates probe, time, and refresh scope through their existing owners', async () => {
    const user = userEvent.setup();
    const setProbes = jest.fn();
    const setTimeRange = jest.fn();
    const setRefresh = jest.fn();
    const refreshNow = jest.fn();

    jest.mocked(useCheckDashboard).mockReturnValue({
      check: {} as ReturnType<typeof useCheckDashboard>['check'],
      probes: [],
      setProbes,
      catalog: ['Paris', 'Tokyo'],
      catalogLoading: true,
      catalogError: false,
    });
    jest.mocked(useAppTime).mockReturnValue({
      raw: { from: 'now-1h', to: 'now' },
      absolute: { from: 0, to: 1 },
      timezone: 'browser',
      refresh: undefined,
      setTimeRange,
      setRefresh,
      refreshNow,
      buildDashboardPath: jest.fn(),
      subscribeRefresh: jest.fn(),
    });

    render(<DashboardScopeControls />);

    const probePicker = screen.getByTestId('probe-multi-combobox');
    expect(probePicker).toHaveAttribute('data-loading', 'true');
    expect(probePicker).toHaveAttribute('data-width', 'auto');
    expect(probePicker).toHaveAttribute('data-min-width', '24');
    expect(probePicker).toHaveAttribute('data-max-width', '32');
    expect(screen.getByRole('combobox', { name: 'Probes' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Select probes' }));
    await user.click(screen.getByRole('button', { name: 'Clear probes' }));
    await user.click(screen.getByRole('button', { name: 'Set time range' }));
    await user.click(screen.getByRole('button', { name: 'Refresh now' }));
    await user.click(screen.getByRole('button', { name: 'Set refresh' }));

    expect(setProbes).toHaveBeenNthCalledWith(1, ['Paris', 'Tokyo']);
    expect(setProbes).toHaveBeenNthCalledWith(2, []);
    expect(setTimeRange).toHaveBeenCalledWith({ from: 'now-6h', to: 'now' });
    expect(refreshNow).toHaveBeenCalledTimes(1);
    expect(setRefresh).toHaveBeenCalledWith('1m');
  });

  it('does not add a separate probe summary beside the selector', () => {
    const contextValue = {
      check: {} as ReturnType<typeof useCheckDashboard>['check'],
      probes: ['Paris'],
      setProbes: jest.fn(),
      catalog: ['Paris', 'Tokyo'],
      catalogLoading: false,
      catalogError: false,
    };
    jest.mocked(useCheckDashboard).mockReturnValue(contextValue);
    jest.mocked(useAppTime).mockReturnValue({
      raw: { from: 'now-1h', to: 'now' },
      absolute: { from: 0, to: 1 },
      timezone: 'browser',
      refresh: undefined,
      setTimeRange: jest.fn(),
      setRefresh: jest.fn(),
      refreshNow: jest.fn(),
      buildDashboardPath: jest.fn(),
      subscribeRefresh: jest.fn(),
    });

    const { rerender } = render(<DashboardScopeControls />);

    expect(screen.queryByText('Selected probes · 1 of 2')).not.toBeInTheDocument();

    jest.mocked(useCheckDashboard).mockReturnValue({ ...contextValue, probes: [] });
    rerender(<DashboardScopeControls />);

    expect(screen.queryByText('Selected probes · 2 of 2')).not.toBeInTheDocument();
  });

  it('omits the probe picker when the catalog fails', () => {
    jest.mocked(useCheckDashboard).mockReturnValue({
      check: {} as ReturnType<typeof useCheckDashboard>['check'],
      probes: [],
      setProbes: jest.fn(),
      catalog: [],
      catalogLoading: false,
      catalogError: true,
    });
    jest.mocked(useAppTime).mockReturnValue({
      raw: { from: 'now-1h', to: 'now' },
      absolute: { from: 0, to: 1 },
      timezone: 'browser',
      refresh: undefined,
      setTimeRange: jest.fn(),
      setRefresh: jest.fn(),
      refreshNow: jest.fn(),
      buildDashboardPath: jest.fn(),
      subscribeRefresh: jest.fn(),
    });

    render(<DashboardScopeControls />);

    expect(screen.queryByRole('button', { name: 'Select probes' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Set time range' })).toBeVisible();
  });
});
