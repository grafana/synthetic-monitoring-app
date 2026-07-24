import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ManualReferenceAvailability } from 'dashboards/comparison/comparisonCoverage';

import { type ComparisonReferenceSpec } from 'dashboards/comparison/comparisonReference.types';
import { useAppTime } from 'contexts/AppTimeProvider';
import {
  type DashboardComparisonContextValue,
  useComparisonReferenceAvailability,
  useDashboardComparison,
} from 'contexts/DashboardComparisonProvider';

import { DashboardComparisonControls, toAbsoluteIso } from './DashboardComparisonControls';

jest.mock('contexts/AppTimeProvider', () => ({ useAppTime: jest.fn() }));
jest.mock('contexts/DashboardComparisonProvider', () => ({
  useComparisonReferenceAvailability: jest.fn(),
  useDashboardComparison: jest.fn(),
}));
jest.mock('@grafana/ui', () => {
  const React = jest.requireActual<typeof import('react')>('react');

  function Dropdown({
    children,
    onVisibleChange,
    overlay,
  }: {
    children: React.ReactElement<{ onClick?: () => void }>;
    onVisibleChange?: (open: boolean) => void;
    overlay: React.ReactElement;
  }) {
    const [open, setOpen] = React.useState(false);

    return (
      <>
        {React.cloneElement(children, {
          onClick: () => {
            const next = !open;

            setOpen(next);
            onVisibleChange?.(next);
          },
        })}
        <div hidden={!open}>{overlay}</div>
      </>
    );
  }

  function Menu({ children, ariaLabel }: { children: React.ReactNode; ariaLabel?: string }) {
    return (
      <div aria-label={ariaLabel} role="menu">
        {children}
      </div>
    );
  }

  function MenuItem({
    active,
    ariaChecked,
    ariaLabel,
    description,
    disabled,
    icon,
    label,
    onClick,
    role = 'menuitem',
  }: {
    active?: boolean;
    ariaChecked?: boolean;
    ariaLabel?: string;
    description?: string;
    disabled?: boolean;
    icon?: string;
    label: string;
    onClick?: () => void;
    role?: React.AriaRole;
  }) {
    const [activeVisual, setActiveVisual] = React.useState(active);

    return (
      <button
        aria-checked={ariaChecked}
        aria-label={ariaLabel}
        data-active={activeVisual}
        disabled={disabled}
        onClick={onClick}
        onMouseLeave={() => setActiveVisual(false)}
        role={role}
        type="button"
      >
        {icon && (
          <span aria-hidden="true" data-icon={icon} data-testid="menu-item-icon">
            {icon}
          </span>
        )}
        <span>{label}</span>
        {description && <span>{description}</span>}
      </button>
    );
  }

  Menu.Item = MenuItem;

  return {
    Alert: ({ children }: { children: React.ReactNode }) => <div role="alert">{children}</div>,
    Button: ({
      children,
      fill: _fill,
      variant: _variant,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & { fill?: string; variant?: string }) => (
      <button {...props}>{children}</button>
    ),
    Dropdown,
    Field: ({
      children,
      error,
      htmlFor,
      label,
    }: {
      children: React.ReactNode;
      error?: React.ReactNode;
      htmlFor?: string;
      label?: React.ReactNode;
    }) => (
      <div>
        <label htmlFor={htmlFor}>{label}</label>
        {children}
        {error && <span role="alert">{error}</span>}
      </div>
    ),
    InlineSwitch: ({
      checked: _checked,
      id,
      label,
      onChange,
      showLabel: _showLabel,
      value,
      ...props
    }: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> & {
      label: string;
      showLabel?: boolean;
      value?: boolean;
    }) => (
      <div>
        <label htmlFor={id}>{label}</label>
        <input checked={value} id={id} onChange={onChange} role="switch" type="checkbox" {...props} />
      </div>
    ),
    Input: ({ invalid: _invalid, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) => (
      <input {...props} />
    ),
    Menu,
    useStyles2: () => ({
      controls: 'controls',
      customActions: 'custom-actions',
      customEditor: 'custom-editor',
      customFields: 'custom-fields',
      selectorGroup: 'selector-group',
      status: 'status',
      visuallyHidden: 'visually-hidden',
    }),
  };
});

const primary = {
  from: Date.parse('2026-07-09T08:00:00.000Z'),
  to: Date.parse('2026-07-09T11:00:00.000Z'),
};
const NORMAL_REFERENCE_BUTTON = 'Comparison reference, Normal · 21d';

let comparison: DashboardComparisonContextValue;
let appTime: ReturnType<typeof useAppTime>;
let availabilityByReference: Record<string, ManualReferenceAvailability>;

function referenceKey(reference: ComparisonReferenceSpec): string {
  if (reference.kind === 'shifted') {
    return reference.presetId;
  }

  return reference.kind;
}

function setComparison(overrides: Partial<DashboardComparisonContextValue> = {}) {
  comparison = {
    enabled: false,
    referenceSpec: null,
    healthReference: { status: 'available', tierId: '21d', range: primary, coverage: 0.9, executionCount: 84 },
    displayReference: null,
    displayAvailability: null,
    setEnabled: jest.fn(),
    setReference: jest.fn(),
    ...overrides,
  };
  jest.mocked(useDashboardComparison).mockImplementation(() => comparison);
}

describe('DashboardComparisonControls', () => {
  beforeEach(() => {
    availabilityByReference = {};
    setComparison();
    appTime = {
      raw: { from: '2026-07-09T08:00:00.000Z', to: '2026-07-09T11:00:00.000Z' },
      absolute: primary,
      rangeMode: 'historical',
      timezone: 'utc',
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
    };
    jest.mocked(useAppTime).mockImplementation(() => appTime);
    jest
      .mocked(useComparisonReferenceAvailability)
      .mockImplementation((reference) => availabilityByReference[referenceKey(reference)] ?? { status: 'checking' });
  });

  it('starts with only the unpressed Compare button and reveals the resolved Normal selector', async () => {
    const user = userEvent.setup();
    const rendered = render(<DashboardComparisonControls />);

    const compare = screen.getByRole('button', { name: 'Compare' });
    expect(compare).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('button', { name: /Comparison reference/ })).not.toBeInTheDocument();

    await user.click(compare);
    expect(comparison.setEnabled).toHaveBeenCalledWith(true);

    setComparison({ enabled: true, referenceSpec: { kind: 'normal' } });
    rendered.rerender(<DashboardComparisonControls />);

    expect(screen.getByRole('button', { name: 'Compare' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: NORMAL_REFERENCE_BUTTON })).toHaveTextContent('Normal · 21d');
  });

  it('keeps the registry order and only mounts candidate availability while the menu is open', async () => {
    const user = userEvent.setup();
    setComparison({ enabled: true, referenceSpec: { kind: 'normal' } });
    render(<DashboardComparisonControls />);

    expect(useComparisonReferenceAvailability).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: NORMAL_REFERENCE_BUTTON }));

    const menu = screen.getByRole('menu', { name: 'Comparison reference' });
    expect(
      within(menu)
        .getAllByRole('menuitemradio')
        .map((item) => item.textContent)
    ).toEqual([
      expect.stringContaining('Normal'),
      expect.stringContaining('Previous period'),
      expect.stringContaining('24 hours ago'),
      expect.stringContaining('7 days ago'),
      expect.stringContaining('14 days ago'),
      expect.stringContaining('21 days ago'),
      expect.stringContaining('30 days ago'),
      expect.stringContaining('3 months ago'),
      expect.stringContaining('1 year ago'),
      expect.stringContaining('Custom range'),
    ]);
    expect(within(menu).getByRole('menuitemradio', { name: /Normal/ })).toHaveAttribute('aria-checked', 'true');
    expect(within(menu).getByRole('menuitemradio', { name: /24 hours ago/ })).toHaveAttribute(
      'aria-checked',
      'false'
    );
    const selectedNormal = within(menu).getByRole('menuitemradio', { name: /Normal/ });

    expect(within(selectedNormal).getByTestId('menu-item-icon')).toHaveAttribute('data-icon', 'check');
    expect(
      within(within(menu).getByRole('menuitemradio', { name: /24 hours ago/ })).queryByTestId('menu-item-icon')
    ).not.toBeInTheDocument();

    fireEvent.mouseLeave(selectedNormal);

    expect(selectedNormal).toHaveAttribute('data-active', 'false');
    expect(within(selectedNormal).getByTestId('menu-item-icon')).toHaveAttribute('data-icon', 'check');
    const openCallCount = jest.mocked(useComparisonReferenceAvailability).mock.calls.length;
    const candidateKeys = new Set(
      jest.mocked(useComparisonReferenceAvailability).mock.calls.map(([reference]) => referenceKey(reference))
    );

    expect(candidateKeys.size).toBe(8);
    expect(jest.mocked(useComparisonReferenceAvailability).mock.calls.every(([, enabled]) => enabled === true)).toBe(
      true
    );

    await user.click(screen.getByRole('button', { name: NORMAL_REFERENCE_BUTTON }));

    expect(useComparisonReferenceAvailability).toHaveBeenCalledTimes(openCallCount);
  });

  it('selects available and partial references without moving the primary range', async () => {
    const user = userEvent.setup();
    availabilityByReference = {
      previous: { status: 'available', coverage: 1, executionCount: 12 },
      '24h': { status: 'partial', coverage: 0.75, executionCount: 9 },
      '7d': { status: 'outside-retention' },
      '14d': { status: 'available', coverage: 1, executionCount: 11 },
      '21d': { status: 'no-retained-executions' },
      '30d': { status: 'query-error' },
      '3m': { status: 'invalid-range' },
      '1y': { status: 'partial', coverage: 0.5, executionCount: 4 },
    };
    setComparison({ enabled: true, referenceSpec: { kind: 'normal' } });
    render(<DashboardComparisonControls />);

    await user.click(screen.getByRole('button', { name: NORMAL_REFERENCE_BUTTON }));

    const menu = screen.getByRole('menu', { name: 'Comparison reference' });
    expect(within(menu).getByRole('menuitemradio', { name: /24 hours ago/ })).toBeEnabled();
    expect(within(menu).getByRole('menuitemradio', { name: /24 hours ago/ })).toHaveTextContent(
      '75% coverage · 9 executions'
    );
    expect(within(menu).getByRole('menuitemradio', { name: /7 days ago/ })).toBeDisabled();
    expect(within(menu).getByRole('menuitemradio', { name: /7 days ago/ })).toHaveTextContent('Outside retention');
    expect(within(menu).getByRole('menuitemradio', { name: /21 days ago/ })).toBeDisabled();
    expect(within(menu).getByRole('menuitemradio', { name: /30 days ago/ })).toBeDisabled();
    expect(within(menu).getByRole('menuitemradio', { name: /3 months ago/ })).toBeDisabled();
    expect(within(menu).getByRole('menuitemradio', { name: /1 year ago/ })).toBeEnabled();

    await user.click(within(menu).getByRole('menuitemradio', { name: /14 days ago/ }));

    expect(comparison.setReference).toHaveBeenCalledWith({ kind: 'shifted', presetId: '14d' });
    expect(appTime.setTimeRange).not.toHaveBeenCalled();
  });

  it('uses one stable live region for candidate checking and resolved unavailable reasons', async () => {
    const user = userEvent.setup();
    setComparison({ enabled: true, referenceSpec: { kind: 'normal' } });
    const rendered = render(<DashboardComparisonControls />);
    const candidateStatus = screen.getByTestId('comparison-candidate-status');

    expect(candidateStatus).toHaveAttribute('aria-live', 'polite');
    expect(candidateStatus).toBeEmptyDOMElement();

    await user.click(screen.getByRole('button', { name: NORMAL_REFERENCE_BUTTON }));

    screen.getByRole('button', { name: NORMAL_REFERENCE_BUTTON }).focus();
    expect(screen.getByTestId('comparison-candidate-status')).toBe(candidateStatus);
    expect(candidateStatus).toHaveTextContent('Checking comparison references');

    const available = { status: 'available', coverage: 1, executionCount: 12 } as const;
    availabilityByReference = {
      previous: available,
      '24h': available,
      '7d': { status: 'outside-retention' },
      '14d': available,
      '21d': available,
      '30d': available,
      '3m': available,
      '1y': available,
    };
    rendered.rerender(<DashboardComparisonControls />);

    expect(candidateStatus).toHaveTextContent('Unavailable comparison references: 7 days ago — Outside retention');
    expect(screen.getByRole('button', { name: NORMAL_REFERENCE_BUTTON })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: NORMAL_REFERENCE_BUTTON }));

    expect(candidateStatus).toBeEmptyDOMElement();
  });

  it('announces checks politely and reports partial selected coverage', () => {
    setComparison({
      enabled: true,
      referenceSpec: { kind: 'shifted', presetId: '24h' },
      displayAvailability: { status: 'partial', coverage: 0.625, executionCount: 15.6 },
    });
    const rendered = render(<DashboardComparisonControls />);

    expect(screen.getByRole('status')).toHaveTextContent('63% coverage · 16 executions');
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');

    setComparison({
      enabled: true,
      referenceSpec: { kind: 'shifted', presetId: '24h' },
      displayAvailability: { status: 'checking' },
    });
    rendered.rerender(<DashboardComparisonControls />);

    expect(screen.getByRole('status')).toHaveTextContent('Checking comparison reference');
  });

  it('shows an absolute custom editor, locks duration, and allows an unlocked unequal range', async () => {
    const user = userEvent.setup();
    setComparison({ enabled: true, referenceSpec: { kind: 'normal' } });
    render(<DashboardComparisonControls />);

    await user.click(screen.getByRole('button', { name: NORMAL_REFERENCE_BUTTON }));
    await user.click(screen.getByRole('menuitemradio', { name: /Custom range/ }));

    const from = screen.getByLabelText('Custom range start');
    const to = screen.getByLabelText('Custom range end');
    const durationLock = screen.getByRole('switch', { name: 'Match selected duration' });

    expect(durationLock).toHaveAttribute('id', 'comparison-match-primary-duration');
    expect(from).toHaveAttribute('type', 'datetime-local');
    expect(to).toHaveAttribute('type', 'datetime-local');
    expect(durationLock).toBeChecked();
    expect(screen.getByText(/Excluded primary interval/)).toHaveTextContent(
      'Excluded primary interval: 2026-07-09 08:00:00.000 +00:00 – 2026-07-09 11:00:00.000 +00:00 (utc)'
    );
    expect(screen.getByText(/Resolved absolute range/)).toHaveTextContent(
      'Resolved absolute range: 2026-07-09T05:00:00.000Z (UTC+00:00) – 2026-07-09T08:00:00.000Z (UTC+00:00)'
    );

    await user.clear(from);
    await user.type(from, '2026-07-08T04:00');
    expect(to).toHaveValue('2026-07-08T07:00');

    await user.click(screen.getByText('Match selected duration'));
    expect(durationLock).not.toBeChecked();
    await user.clear(to);
    await user.type(to, '2026-07-08T09:00');
    await user.click(screen.getByRole('button', { name: 'Apply custom range' }));

    expect(comparison.setReference).toHaveBeenCalledWith({
      kind: 'custom',
      from: '2026-07-08T04:00:00.000Z',
      to: '2026-07-08T09:00:00.000Z',
      matchPrimaryDuration: false,
    });
  });

  it('rederives and saves the primary duration immediately when duration matching is enabled', async () => {
    const user = userEvent.setup();
    setComparison({ enabled: true, referenceSpec: { kind: 'normal' } });
    render(<DashboardComparisonControls />);

    await user.click(screen.getByRole('button', { name: NORMAL_REFERENCE_BUTTON }));
    await user.click(screen.getByRole('menuitemradio', { name: /Custom range/ }));
    await user.click(screen.getByText('Match selected duration'));

    const from = screen.getByLabelText('Custom range start');
    const to = screen.getByLabelText('Custom range end');

    await user.clear(from);
    await user.type(from, '2026-07-08T04:00');
    await user.clear(to);
    await user.type(to, '2026-07-08T09:00');
    expect(to).toHaveValue('2026-07-08T09:00');

    await user.click(screen.getByText('Match selected duration'));

    expect(screen.getByRole('switch', { name: 'Match selected duration' })).toBeChecked();
    expect(to).toHaveValue('2026-07-08T07:00');

    await user.click(screen.getByRole('button', { name: 'Apply custom range' }));

    expect(comparison.setReference).toHaveBeenCalledWith({
      kind: 'custom',
      from: '2026-07-08T04:00:00.000Z',
      to: '2026-07-08T07:00:00.000Z',
      matchPrimaryDuration: true,
    });
  });

  it('closes and clears an invalid custom draft when comparison is disabled, then re-enables on Normal', async () => {
    const user = userEvent.setup();
    setComparison({ enabled: true, referenceSpec: { kind: 'normal' } });
    const rendered = render(<DashboardComparisonControls />);

    await user.click(screen.getByRole('button', { name: NORMAL_REFERENCE_BUTTON }));
    await user.click(screen.getByRole('menuitemradio', { name: /Custom range/ }));
    await user.clear(screen.getByLabelText('Custom range start'));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid custom start');

    await user.click(screen.getByRole('button', { name: 'Compare' }));
    expect(comparison.setEnabled).toHaveBeenCalledWith(false);

    setComparison({ enabled: false, referenceSpec: null });
    rendered.rerender(<DashboardComparisonControls />);
    expect(screen.queryByText('Custom comparison range')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Compare' }));
    expect(comparison.setEnabled).toHaveBeenCalledWith(true);

    setComparison({ enabled: true, referenceSpec: { kind: 'normal' } });
    rendered.rerender(<DashboardComparisonControls />);
    expect(screen.getByRole('button', { name: NORMAL_REFERENCE_BUTTON })).toBeVisible();
    expect(screen.queryByText('Custom comparison range')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: NORMAL_REFERENCE_BUTTON }));
    await user.click(screen.getByRole('menuitemradio', { name: /Custom range/ }));
    expect(screen.getByLabelText('Custom range start')).toHaveValue('2026-07-09T05:00');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('closes and clears the custom editor when a non-custom reference is selected', async () => {
    const user = userEvent.setup();
    availabilityByReference = {
      previous: { status: 'available', coverage: 1, executionCount: 12 },
    };
    setComparison({ enabled: true, referenceSpec: { kind: 'normal' } });
    render(<DashboardComparisonControls />);

    await user.click(screen.getByRole('button', { name: NORMAL_REFERENCE_BUTTON }));
    await user.click(screen.getByRole('menuitemradio', { name: /Custom range/ }));
    await user.clear(screen.getByLabelText('Custom range start'));

    await user.click(screen.getByRole('button', { name: NORMAL_REFERENCE_BUTTON }));
    await user.click(screen.getByRole('button', { name: NORMAL_REFERENCE_BUTTON }));
    await user.click(screen.getByRole('menuitemradio', { name: /Previous period/ }));

    expect(comparison.setReference).toHaveBeenCalledWith({ kind: 'previous' });
    expect(screen.queryByText('Custom comparison range')).not.toBeInTheDocument();
  });

  it('resets an open custom editor when the URL reference changes externally to a non-custom reference', async () => {
    const user = userEvent.setup();
    setComparison({ enabled: true, referenceSpec: { kind: 'normal' } });
    const rendered = render(<DashboardComparisonControls />);

    await user.click(screen.getByRole('button', { name: NORMAL_REFERENCE_BUTTON }));
    await user.click(screen.getByRole('menuitemradio', { name: /Custom range/ }));
    await user.clear(screen.getByLabelText('Custom range start'));

    rendered.rerender(<DashboardComparisonControls />);
    expect(screen.getByText('Custom comparison range')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid custom start');

    setComparison({
      enabled: true,
      referenceSpec: { kind: 'previous' },
      displayAvailability: { status: 'available', coverage: 1, executionCount: 12 },
    });
    rendered.rerender(<DashboardComparisonControls />);

    expect(screen.queryByText('Custom comparison range')).not.toBeInTheDocument();

    setComparison({ enabled: true, referenceSpec: { kind: 'normal' } });
    rendered.rerender(<DashboardComparisonControls />);
    await user.click(screen.getByRole('button', { name: NORMAL_REFERENCE_BUTTON }));
    await user.click(screen.getByRole('button', { name: NORMAL_REFERENCE_BUTTON }));
    await user.click(screen.getByRole('menuitemradio', { name: /Custom range/ }));

    expect(screen.getByLabelText('Custom range start')).toHaveValue('2026-07-09T05:00');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('parses only the fixed datetime-local format and rejects a DST gap', () => {
    expect(toAbsoluteIso('2026-07-08T04:00', 'utc')).toBe('2026-07-08T04:00:00.000Z');
    expect(toAbsoluteIso('08/07/2026 04:00', 'utc')).toBeNull();
    expect(toAbsoluteIso('2026-03-29T01:30', 'Europe/London')).toBeNull();
  });

  it('chooses the earlier repeated-hour occurrence and shows its UTC and offset interpretation', async () => {
    const user = userEvent.setup();
    appTime = {
      ...appTime,
      absolute: {
        from: Date.parse('2026-11-01T08:00:00.000Z'),
        to: Date.parse('2026-11-01T11:00:00.000Z'),
      },
      timezone: 'Europe/London',
    };
    setComparison({ enabled: true, referenceSpec: { kind: 'normal' } });
    render(<DashboardComparisonControls />);

    expect(toAbsoluteIso('2026-10-25T01:30', 'Europe/London')).toBe('2026-10-25T00:30:00.000Z');

    await user.click(screen.getByRole('button', { name: NORMAL_REFERENCE_BUTTON }));
    await user.click(screen.getByRole('menuitemradio', { name: /Custom range/ }));
    await user.click(screen.getByText('Match selected duration'));
    await user.clear(screen.getByLabelText('Custom range start'));
    await user.type(screen.getByLabelText('Custom range start'), '2026-10-25T01:30');
    await user.clear(screen.getByLabelText('Custom range end'));
    await user.type(screen.getByLabelText('Custom range end'), '2026-10-25T02:30');

    expect(screen.getByText(/Resolved absolute range/)).toHaveTextContent(
      'Resolved absolute range: 2026-10-25T00:30:00.000Z (UTC+01:00) – 2026-10-25T02:30:00.000Z (UTC+00:00)'
    );
  });

  it('recomputes the derived end when the primary duration changes while locked', async () => {
    const user = userEvent.setup();
    setComparison({ enabled: true, referenceSpec: { kind: 'normal' } });
    const rendered = render(<DashboardComparisonControls />);

    await user.click(screen.getByRole('button', { name: NORMAL_REFERENCE_BUTTON }));
    await user.click(screen.getByRole('menuitemradio', { name: /Custom range/ }));
    await user.clear(screen.getByLabelText('Custom range start'));
    await user.type(screen.getByLabelText('Custom range start'), '2026-07-08T04:00');

    expect(screen.getByLabelText('Custom range end')).toHaveValue('2026-07-08T07:00');

    appTime = {
      ...appTime,
      absolute: {
        from: primary.from,
        to: primary.from + 5 * 60 * 60 * 1000,
      },
    };
    rendered.rerender(<DashboardComparisonControls />);

    expect(screen.getByRole('switch', { name: 'Match selected duration' })).toBeChecked();
    expect(screen.getByLabelText('Custom range end')).toHaveValue('2026-07-08T09:00');
  });

  it('rejects overlap but accepts half-open boundary contact', async () => {
    const user = userEvent.setup();
    setComparison({ enabled: true, referenceSpec: { kind: 'normal' } });
    render(<DashboardComparisonControls />);

    await user.click(screen.getByRole('button', { name: NORMAL_REFERENCE_BUTTON }));
    await user.click(screen.getByRole('menuitemradio', { name: /Custom range/ }));
    await user.click(screen.getByText('Match selected duration'));

    const from = screen.getByLabelText('Custom range start');
    const to = screen.getByLabelText('Custom range end');
    const apply = screen.getByRole('button', { name: 'Apply custom range' });

    await user.clear(from);
    await user.type(from, '2026-07-09T07:00');
    await user.clear(to);
    await user.type(to, '2026-07-09T09:00');

    expect(screen.getByRole('alert')).toHaveTextContent('Custom range must not overlap the selected primary interval');
    expect(apply).toBeDisabled();
    expect(from).toHaveAttribute('aria-invalid', 'true');
    expect(to).toHaveAttribute('aria-invalid', 'true');
    expect(from).toHaveAttribute('aria-describedby', 'comparison-custom-range-error');
    expect(to).toHaveAttribute('aria-describedby', 'comparison-custom-range-error');

    await user.clear(to);
    await user.type(to, '2026-07-09T08:00');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(apply).toBeEnabled();
    expect(from).toHaveAttribute('aria-invalid', 'false');
    expect(to).toHaveAttribute('aria-invalid', 'false');
  });

  it('associates invalid start and end messages with the relevant custom input', async () => {
    const user = userEvent.setup();
    setComparison({ enabled: true, referenceSpec: { kind: 'normal' } });
    render(<DashboardComparisonControls />);

    await user.click(screen.getByRole('button', { name: NORMAL_REFERENCE_BUTTON }));
    await user.click(screen.getByRole('menuitemradio', { name: /Custom range/ }));

    const from = screen.getByLabelText('Custom range start');
    const to = screen.getByLabelText('Custom range end');

    await user.clear(from);

    expect(from).toHaveAttribute('aria-invalid', 'true');
    expect(from).toHaveAttribute('aria-describedby', 'comparison-custom-from-error');
    expect(screen.getByText('Enter a valid custom start')).toHaveAttribute('id', 'comparison-custom-from-error');
    expect(to).toHaveAttribute('aria-invalid', 'false');
    expect(to).not.toHaveAttribute('aria-describedby');

    await user.type(from, '2026-07-09T05:00');
    await user.clear(to);

    expect(from).toHaveAttribute('aria-invalid', 'false');
    expect(from).not.toHaveAttribute('aria-describedby');
    expect(to).toHaveAttribute('aria-invalid', 'true');
    expect(to).toHaveAttribute('aria-describedby', 'comparison-custom-to-error');
    expect(screen.getByText('Enter a valid custom end')).toHaveAttribute('id', 'comparison-custom-to-error');
  });

  it('keeps an invalid selected custom reference visible after the primary range moves', () => {
    const customReference = {
      kind: 'custom',
      from: '2026-07-08T08:00:00.000Z',
      to: '2026-07-08T11:00:00.000Z',
      matchPrimaryDuration: true,
    } as const;
    setComparison({
      enabled: true,
      referenceSpec: customReference,
      displayAvailability: { status: 'available', coverage: 1, executionCount: 12 },
    });
    const rendered = render(<DashboardComparisonControls />);

    expect(screen.getByRole('button', { name: 'Comparison reference, Custom range' })).toBeVisible();

    appTime = {
      ...appTime,
      absolute: {
        from: Date.parse('2026-07-08T10:00:00.000Z'),
        to: Date.parse('2026-07-09T11:00:00.000Z'),
      },
    };
    setComparison({
      enabled: true,
      referenceSpec: customReference,
      displayAvailability: { status: 'overlaps-primary' },
    });
    rendered.rerender(<DashboardComparisonControls />);

    expect(screen.getByRole('button', { name: 'Comparison reference, Custom range' })).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Overlaps the selected primary interval');
  });

  it.each([
    [{ status: 'checking' } as const, 'Normal · checking'],
    [{ status: 'query-error' } as const, 'Normal unavailable · query failed'],
    [{ status: 'not-established' } as const, 'Normal not established for this period'],
    [
      { status: 'available', tierId: '21d', range: primary, coverage: 0.9, executionCount: 84 } as const,
      'Normal · 21d',
    ],
  ])('uses a distinct Normal trigger label for $expected', (healthReference, expected) => {
    setComparison({
      enabled: true,
      referenceSpec: { kind: 'normal' },
      healthReference,
    });

    render(<DashboardComparisonControls />);

    expect(screen.getByRole('button', { name: `Comparison reference, ${expected}` })).toHaveTextContent(expected);
  });
});
