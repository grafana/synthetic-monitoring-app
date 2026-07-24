import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAppTime } from 'contexts/AppTimeProvider';
import { DEFAULT_APP_TIME_RANGE } from 'contexts/AppTimeProvider.utils';
import { useDashboardPanelScope } from 'contexts/DashboardPanelScopeProvider';

import { DashboardPanelScopeControls, DashboardTimeControls } from './DashboardScopeControls';

jest.mock('contexts/AppTimeProvider', () => ({ useAppTime: jest.fn() }));
jest.mock('contexts/DashboardPanelScopeProvider', () => ({ useDashboardPanelScope: jest.fn() }));
jest.mock('./DashboardComparisonControls', () => ({
  DashboardComparisonControls: () => <button type="button">Compare</button>,
}));
jest.mock('@grafana/ui', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  Stack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Field: ({ children, htmlFor, label }: { children: React.ReactNode; htmlFor?: string; label?: React.ReactNode }) => (
    <div>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  ),
  useStyles2: () => ({ probeField: 'probe-field' }),
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
  it('updates probe scope and keeps supplied panel filters together', async () => {
    const user = userEvent.setup();
    const setProbes = jest.fn();

    jest.mocked(useDashboardPanelScope).mockReturnValue({
      probes: [],
      setProbes,
      catalog: ['Paris', 'Tokyo'],
      catalogLoading: true,
      catalogError: false,
    });

    render(<DashboardPanelScopeControls filters={<div>Execution filters</div>} />);

    const probePicker = screen.getByTestId('probe-multi-combobox');
    expect(probePicker).toHaveAttribute('data-loading', 'true');
    expect(probePicker).toHaveAttribute('data-width', 'auto');
    expect(probePicker).toHaveAttribute('data-min-width', '24');
    expect(probePicker).toHaveAttribute('data-max-width', '32');
    expect(screen.getByRole('combobox', { name: 'Probes' })).toBeVisible();
    expect(screen.getByText('Execution filters')).toBeVisible();
    expect(screen.getByLabelText('Panel filters')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Set time range' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Select probes' }));
    await user.click(screen.getByRole('button', { name: 'Clear probes' }));

    expect(setProbes).toHaveBeenNthCalledWith(1, ['Paris', 'Tokyo']);
    expect(setProbes).toHaveBeenNthCalledWith(2, []);
  });

  it('keeps comparison at the start and time range plus refresh together at the end', async () => {
    const user = userEvent.setup();
    const appTime = mockAppTime();

    render(<DashboardTimeControls />);

    const timeControls = screen.getByLabelText('Dashboard controls');
    const startGroup = within(timeControls).getByTestId('dashboard-start-group');
    const endGroup = within(timeControls).getByTestId('dashboard-end-group');
    expect(startGroup).toHaveTextContent('Compare');
    expect(endGroup).toHaveTextContent(/Set time range[\s\S]*Refresh now/);
    expect(endGroup).toHaveStyle({ marginLeft: 'auto' });
    expect(within(startGroup).queryByRole('button', { name: 'Set time range' })).not.toBeInTheDocument();
    expect(within(endGroup).queryByRole('button', { name: 'Compare' })).not.toBeInTheDocument();
    expect(within(timeControls).queryByRole('combobox', { name: 'Probes' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Set time range' }));
    await user.click(screen.getByRole('button', { name: 'Refresh now' }));
    await user.click(screen.getByRole('button', { name: 'Set refresh' }));

    expect(appTime.setTimeRange).toHaveBeenCalledWith({ from: 'now-6h', to: 'now' });
    expect(appTime.refreshNow).toHaveBeenCalledTimes(1);
    expect(appTime.setRefresh).toHaveBeenCalledWith('1m');
  });

  it('wires time navigation and timezone controls to AppTimeProvider', async () => {
    const user = userEvent.setup();
    const appTime = mockAppTime();

    render(<DashboardTimeControls />);

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
      probes: ['Paris'],
      setProbes: jest.fn(),
      catalog: ['Paris', 'Tokyo'],
      catalogLoading: false,
      catalogError: false,
    };
    jest.mocked(useDashboardPanelScope).mockReturnValue(contextValue);

    const { rerender } = render(<DashboardPanelScopeControls />);

    expect(screen.queryByText('Selected probes · 1 of 2')).not.toBeInTheDocument();

    jest.mocked(useDashboardPanelScope).mockReturnValue({ ...contextValue, probes: [] });
    rerender(<DashboardPanelScopeControls />);

    expect(screen.queryByText('Selected probes · 2 of 2')).not.toBeInTheDocument();
  });

  it('shows clear filters when probes are selected and clears them', async () => {
    const user = userEvent.setup();
    const setProbes = jest.fn();
    const contextValue = {
      probes: ['Paris'],
      setProbes,
      catalog: ['Paris', 'Tokyo'],
      catalogLoading: false,
      catalogError: false,
    };

    jest.mocked(useDashboardPanelScope).mockReturnValue(contextValue);

    const { rerender } = render(<DashboardPanelScopeControls />);

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(setProbes).toHaveBeenCalledWith([]);

    jest.mocked(useDashboardPanelScope).mockReturnValue({ ...contextValue, probes: [] });
    rerender(<DashboardPanelScopeControls />);

    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });

  it('omits the probe picker when the catalog fails', () => {
    jest.mocked(useDashboardPanelScope).mockReturnValue({
      probes: [],
      setProbes: jest.fn(),
      catalog: [],
      catalogLoading: false,
      catalogError: true,
    });

    render(<DashboardPanelScopeControls filters={<div>Execution filters</div>} />);

    expect(screen.queryByRole('button', { name: 'Select probes' })).not.toBeInTheDocument();
    expect(screen.getByText('Execution filters')).toBeVisible();
  });

  it('replaces refresh controls with Go to now for historical ranges', async () => {
    const user = userEvent.setup();
    const appTime = mockAppTime({
      rangeMode: 'historical',
      raw: { from: '2026-07-23T12:00:00.000Z', to: '2026-07-23T14:00:00.000Z' },
    });

    render(<DashboardTimeControls />);

    expect(screen.queryByRole('button', { name: 'Refresh now' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Set refresh' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Go to now' }));

    expect(appTime.setTimeRange).toHaveBeenCalledWith(DEFAULT_APP_TIME_RANGE);
  });
});
