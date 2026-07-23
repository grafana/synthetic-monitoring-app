import React from 'react';
import { render, screen, within } from '@testing-library/react';
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
  TimeRangePicker: ({
    onChange,
    onChangeTimeZone,
    onMoveBackward,
    onMoveForward,
    onZoom,
  }: {
    onChange: (range: { raw: { from: string; to: string } }) => void;
    onChangeTimeZone: (timezone: string) => void;
    onMoveBackward: () => void;
    onMoveForward: () => void;
    onZoom: () => void;
  }) => (
    <>
      <button type="button" onClick={() => onChange({ raw: { from: 'now-6h', to: 'now' } })}>
        Set time range
      </button>
      <button type="button" onClick={onMoveBackward}>
        Move backward
      </button>
      <button type="button" onClick={onMoveForward}>
        Move forward
      </button>
      <button type="button" onClick={onZoom}>
        Zoom out
      </button>
      <button type="button" onClick={() => onChangeTimeZone('utc')}>
        Set timezone
      </button>
    </>
  ),
}));

function mockAppTime(overrides: Partial<ReturnType<typeof useAppTime>> = {}) {
  const value = {
    raw: { from: 'now-1h', to: 'now' },
    absolute: { from: 0, to: 1 },
    rangeMode: 'live' as const,
    timezone: 'browser',
    refresh: undefined,
    setTimeRange: jest.fn(),
    setTimezone: jest.fn(),
    setRefresh: jest.fn(),
    refreshNow: jest.fn(),
    shiftBackward: jest.fn(),
    shiftForward: jest.fn(),
    zoomOut: jest.fn(),
    buildDashboardPath: jest.fn(),
    subscribeRefresh: jest.fn(),
    ...overrides,
  };

  jest.mocked(useAppTime).mockReturnValue(value);

  return value;
}

describe('DashboardScopeControls', () => {
  it('updates probe, time, and refresh scope through their existing owners', async () => {
    const user = userEvent.setup();
    const setProbes = jest.fn();
    const appTime = mockAppTime();

    jest.mocked(useCheckDashboard).mockReturnValue({
      check: {} as ReturnType<typeof useCheckDashboard>['check'],
      probes: [],
      setProbes,
      catalog: ['Paris', 'Tokyo'],
      catalogLoading: true,
      catalogError: false,
    });

    render(<DashboardScopeControls filters={<div>Execution filters</div>} />);

    const probePicker = screen.getByTestId('probe-multi-combobox');
    expect(probePicker).toHaveAttribute('data-loading', 'true');
    expect(probePicker).toHaveAttribute('data-width', 'auto');
    expect(probePicker).toHaveAttribute('data-min-width', '24');
    expect(probePicker).toHaveAttribute('data-max-width', '32');
    expect(screen.getByRole('combobox', { name: 'Probes' })).toBeVisible();
    expect(screen.getByText('Execution filters')).toBeVisible();

    const groups = within(screen.getByLabelText('Dashboard scope controls')).getAllByTestId('command-bar-group');
    expect(groups.map((group) => group.textContent)).toEqual([
      expect.stringMatching(/Select probes[\s\S]*Execution filters/),
      expect.stringMatching(/Set time range[\s\S]*Refresh now/),
    ]);

    await user.click(screen.getByRole('button', { name: 'Select probes' }));
    await user.click(screen.getByRole('button', { name: 'Clear probes' }));
    await user.click(screen.getByRole('button', { name: 'Set time range' }));
    await user.click(screen.getByRole('button', { name: 'Refresh now' }));
    await user.click(screen.getByRole('button', { name: 'Set refresh' }));

    expect(setProbes).toHaveBeenNthCalledWith(1, ['Paris', 'Tokyo']);
    expect(setProbes).toHaveBeenNthCalledWith(2, []);
    expect(appTime.setTimeRange).toHaveBeenCalledWith({ from: 'now-6h', to: 'now' });
    expect(appTime.refreshNow).toHaveBeenCalledTimes(1);
    expect(appTime.setRefresh).toHaveBeenCalledWith('1m');
  });

  it('wires time navigation and timezone controls to AppTimeProvider', async () => {
    const user = userEvent.setup();
    const appTime = mockAppTime();

    jest.mocked(useCheckDashboard).mockReturnValue({
      check: {} as ReturnType<typeof useCheckDashboard>['check'],
      probes: [],
      setProbes: jest.fn(),
      catalog: ['Paris'],
      catalogLoading: false,
      catalogError: false,
    });

    render(<DashboardScopeControls />);

    await user.click(screen.getByRole('button', { name: 'Move backward' }));
    await user.click(screen.getByRole('button', { name: 'Move forward' }));
    await user.click(screen.getByRole('button', { name: 'Zoom out' }));
    await user.click(screen.getByRole('button', { name: 'Set timezone' }));

    expect(appTime.shiftBackward).toHaveBeenCalledTimes(1);
    expect(appTime.shiftForward).toHaveBeenCalledTimes(1);
    expect(appTime.zoomOut).toHaveBeenCalledTimes(1);
    expect(appTime.setTimezone).toHaveBeenCalledWith('utc');
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
    mockAppTime();

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
    mockAppTime();

    render(<DashboardScopeControls />);

    expect(screen.queryByRole('button', { name: 'Select probes' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Set time range' })).toBeVisible();
  });
});
