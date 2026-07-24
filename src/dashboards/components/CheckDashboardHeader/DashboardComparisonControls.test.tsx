import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAppTime } from 'contexts/AppTimeProvider';
import { type DashboardComparisonContextValue, useDashboardComparison } from 'contexts/DashboardComparisonProvider';

import { DashboardComparisonControls, toAbsoluteIso } from './DashboardComparisonControls';

jest.mock('contexts/AppTimeProvider', () => ({ useAppTime: jest.fn() }));
jest.mock('contexts/DashboardComparisonProvider', () => ({
  useDashboardComparison: jest.fn(),
}));
jest.mock('components/Toggletip', () => {
  const React = jest.requireActual<typeof import('react')>('react');

  return {
    Toggletip: ({
      children,
      content,
      onOpenChange,
      open,
    }: {
      children: React.ReactElement;
      content: React.ReactNode;
      onOpenChange?: (open: boolean) => void;
      open?: boolean;
    }) => (
      <>
        {React.cloneElement(children, {
          onClick: () => onOpenChange?.(!open),
        } as React.HTMLAttributes<HTMLElement>)}
        {open ? <div data-testid="toggletip-content">{content}</div> : null}
      </>
    ),
  };
});
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

  function MenuDivider() {
    return <hr />;
  }

  function MenuGroup({ children, label }: { children: React.ReactNode; label?: string }) {
    return (
      <div role="group">
        {label && <span>{label}</span>}
        {children}
      </div>
    );
  }

  Menu.Item = MenuItem;
  Menu.Divider = MenuDivider;
  Menu.Group = MenuGroup;

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
    Icon: ({ name }: { name: string }) => <span aria-hidden="true" data-icon={name} data-testid="icon" />,
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
    Stack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
const ACTIVE_REFERENCE_BUTTON = 'Comparison reference, Last 30 days';

let comparison: DashboardComparisonContextValue;
let appTime: ReturnType<typeof useAppTime>;

function setComparison(overrides: Partial<DashboardComparisonContextValue> = {}) {
  comparison = {
    enabled: false,
    referenceSpec: null,
    healthReference: { status: 'available', tierId: '21d', range: primary, coverage: 0.9, executionCount: 84 },
    displayReference: null,
    displayAvailability: null,
    automaticSelection: { status: 'inactive' },
    setEnabled: jest.fn(),
    setReference: jest.fn(),
    retryAutomaticSelection: jest.fn(),
    ...overrides,
  };
  jest.mocked(useDashboardComparison).mockImplementation(() => comparison);
}

describe('DashboardComparisonControls', () => {
  beforeEach(() => {
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
  });

  it('keeps the comparison switch visible through off, finding, and resolved states', async () => {
    const user = userEvent.setup();
    const rendered = render(<DashboardComparisonControls />);

    const compare = screen.getByRole('switch', { name: 'Compare' });
    expect(compare).not.toBeChecked();

    await user.click(compare);
    expect(comparison.setEnabled).toHaveBeenCalledWith(true);

    setComparison({
      enabled: true,
      referenceSpec: { kind: 'auto' },
      automaticSelection: { status: 'finding', candidatePresetId: '30d' },
    });
    rendered.rerender(<DashboardComparisonControls />);

    expect(screen.getByRole('switch', { name: 'Compare' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Comparison reference, Finding comparison…' })).toBeVisible();

    setComparison({
      enabled: true,
      referenceSpec: { kind: 'baseline', presetId: '30d' },
      displayAvailability: { status: 'available', coverage: 1, executionCount: 180 },
    });
    rendered.rerender(<DashboardComparisonControls />);

    expect(screen.getByRole('button', { name: ACTIVE_REFERENCE_BUTTON })).toHaveTextContent('Last 30 days');
    expect(screen.getByRole('switch', { name: 'Compare' })).toBeChecked();
  });

  it('uses a persistent switch to disable comparison and a separate remove action for the reference', async () => {
    const user = userEvent.setup();
    setComparison({
      enabled: true,
      referenceSpec: { kind: 'baseline', presetId: '30d' },
      displayAvailability: { status: 'available', coverage: 1, executionCount: 180 },
    });
    render(<DashboardComparisonControls />);

    const toggle = screen.getByRole('switch', { name: 'Compare' });

    expect(toggle).toBeChecked();
    expect(screen.getByRole('button', { name: ACTIVE_REFERENCE_BUTTON })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Remove comparison, Last 30 days' })).toBeVisible();

    await user.click(toggle);

    expect(comparison.setEnabled).toHaveBeenCalledWith(false);

    await user.click(screen.getByRole('button', { name: 'Remove comparison, Last 30 days' }));

    expect(comparison.setReference).toHaveBeenCalledWith(null);
  });

  it('keeps the registry order without preflighting every candidate when the menu opens', async () => {
    const user = userEvent.setup();
    setComparison({ enabled: true, referenceSpec: { kind: 'baseline', presetId: '30d' } });
    render(<DashboardComparisonControls />);

    await user.click(screen.getByRole('button', { name: ACTIVE_REFERENCE_BUTTON }));

    const menu = screen.getByRole('menu', { name: 'Comparison reference' });
    expect(within(menu).getByText('Normal baseline')).toBeVisible();
    expect(within(menu).getByText('Same period')).toBeVisible();
    expect(
      within(menu)
        .getAllByRole('menuitemradio')
        .map((item) => item.textContent)
    ).toEqual([
      expect.stringContaining('Last 30 days'),
      expect.stringContaining('Last 21 days'),
      expect.stringContaining('Last 14 days'),
      expect.stringContaining('Last 7 days'),
      expect.stringContaining('Last 24 hours'),
      expect.stringContaining('Previous period'),
      expect.stringContaining('Same period yesterday'),
      expect.stringContaining('Same period last week'),
      expect.stringContaining('Same period last month'),
      expect.stringContaining('Custom range'),
    ]);
    expect(within(menu).getByRole('menuitemradio', { name: /Last 30 days/ })).toHaveAttribute('aria-checked', 'true');
    expect(within(menu).getByRole('menuitemradio', { name: /Same period yesterday/ })).toHaveAttribute(
      'aria-checked',
      'false'
    );
    const selectedReference = within(menu).getByRole('menuitemradio', { name: /Last 30 days/ });

    expect(within(selectedReference).getByTestId('menu-item-icon')).toHaveAttribute('data-icon', 'check');
    expect(
      within(within(menu).getByRole('menuitemradio', { name: /Same period yesterday/ })).queryByTestId(
        'menu-item-icon'
      )
    ).not.toBeInTheDocument();

    fireEvent.mouseLeave(selectedReference);

    expect(selectedReference).toHaveAttribute('data-active', 'false');
    expect(within(selectedReference).getByTestId('menu-item-icon')).toHaveAttribute('data-icon', 'check');
    expect(within(menu).queryByText('Checking availability')).not.toBeInTheDocument();
    expect(within(menu).queryByText('Normal')).not.toBeInTheDocument();
    expect(within(menu).queryByText('Typical')).not.toBeInTheDocument();
    expect(within(menu).queryByText('1 year ago')).not.toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Turn off comparison' })).not.toBeInTheDocument();
  });

  it('selects a reference without preflight availability and leaves validation to the active comparison', async () => {
    const user = userEvent.setup();
    setComparison({ enabled: true, referenceSpec: { kind: 'baseline', presetId: '30d' } });
    render(<DashboardComparisonControls />);

    await user.click(screen.getByRole('button', { name: ACTIVE_REFERENCE_BUTTON }));

    const menu = screen.getByRole('menu', { name: 'Comparison reference' });
    const baselineReference = within(menu).getByRole('menuitemradio', { name: /Last 14 days/ });

    expect(baselineReference).toBeEnabled();
    expect(baselineReference).toHaveTextContent('Last 14 days');

    await user.click(baselineReference);

    expect(comparison.setReference).toHaveBeenCalledWith({ kind: 'baseline', presetId: '14d' });
    expect(appTime.setTimeRange).not.toHaveBeenCalled();
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
    setComparison({ enabled: true, referenceSpec: { kind: 'baseline', presetId: '30d' } });
    render(<DashboardComparisonControls />);

    await user.click(screen.getByRole('button', { name: ACTIVE_REFERENCE_BUTTON }));
    await user.click(screen.getByRole('menuitemradio', { name: /Custom range/ }));

    expect(screen.getByTestId('toggletip-content')).toHaveTextContent('Custom comparison range');
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
    setComparison({ enabled: true, referenceSpec: { kind: 'baseline', presetId: '30d' } });
    render(<DashboardComparisonControls />);

    await user.click(screen.getByRole('button', { name: ACTIVE_REFERENCE_BUTTON }));
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

  it('closes and clears an invalid custom draft when comparison is disabled, then re-enables automatically', async () => {
    const user = userEvent.setup();
    setComparison({ enabled: true, referenceSpec: { kind: 'baseline', presetId: '30d' } });
    const rendered = render(<DashboardComparisonControls />);

    await user.click(screen.getByRole('button', { name: ACTIVE_REFERENCE_BUTTON }));
    await user.click(screen.getByRole('menuitemradio', { name: /Custom range/ }));
    await user.clear(screen.getByLabelText('Custom range start'));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid custom start');

    await user.click(screen.getByRole('switch', { name: 'Compare' }));
    expect(comparison.setEnabled).toHaveBeenCalledWith(false);

    setComparison({ enabled: false, referenceSpec: { kind: 'baseline', presetId: '30d' } });
    rendered.rerender(<DashboardComparisonControls />);
    expect(screen.queryByText('Custom comparison range')).not.toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Compare' }));
    expect(comparison.setEnabled).toHaveBeenCalledWith(true);

    setComparison({ enabled: true, referenceSpec: { kind: 'baseline', presetId: '30d' } });
    rendered.rerender(<DashboardComparisonControls />);
    expect(screen.getByRole('button', { name: ACTIVE_REFERENCE_BUTTON })).toBeVisible();
    expect(screen.queryByText('Custom comparison range')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: ACTIVE_REFERENCE_BUTTON }));
    await user.click(screen.getByRole('menuitemradio', { name: /Custom range/ }));
    expect(screen.getByLabelText('Custom range start')).toHaveValue('2026-07-09T05:00');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('cancels and clears the custom editor before selecting a non-custom reference', async () => {
    const user = userEvent.setup();
    setComparison({ enabled: true, referenceSpec: { kind: 'baseline', presetId: '30d' } });
    render(<DashboardComparisonControls />);

    await user.click(screen.getByRole('button', { name: ACTIVE_REFERENCE_BUTTON }));
    await user.click(screen.getByRole('menuitemradio', { name: /Custom range/ }));
    await user.clear(screen.getByLabelText('Custom range start'));

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: ACTIVE_REFERENCE_BUTTON }));
    await user.click(screen.getByRole('menuitemradio', { name: /Previous period/ }));

    expect(comparison.setReference).toHaveBeenCalledWith({ kind: 'previous' });
    expect(screen.queryByText('Custom comparison range')).not.toBeInTheDocument();
  });

  it('resets an open custom editor when the URL reference changes externally to a non-custom reference', async () => {
    const user = userEvent.setup();
    setComparison({ enabled: true, referenceSpec: { kind: 'baseline', presetId: '30d' } });
    const rendered = render(<DashboardComparisonControls />);

    await user.click(screen.getByRole('button', { name: ACTIVE_REFERENCE_BUTTON }));
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

    setComparison({ enabled: true, referenceSpec: { kind: 'baseline', presetId: '30d' } });
    rendered.rerender(<DashboardComparisonControls />);
    await user.click(screen.getByRole('button', { name: ACTIVE_REFERENCE_BUTTON }));
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
    setComparison({ enabled: true, referenceSpec: { kind: 'baseline', presetId: '30d' } });
    render(<DashboardComparisonControls />);

    expect(toAbsoluteIso('2026-10-25T01:30', 'Europe/London')).toBe('2026-10-25T00:30:00.000Z');

    await user.click(screen.getByRole('button', { name: ACTIVE_REFERENCE_BUTTON }));
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
    setComparison({ enabled: true, referenceSpec: { kind: 'baseline', presetId: '30d' } });
    const rendered = render(<DashboardComparisonControls />);

    await user.click(screen.getByRole('button', { name: ACTIVE_REFERENCE_BUTTON }));
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
    setComparison({ enabled: true, referenceSpec: { kind: 'baseline', presetId: '30d' } });
    render(<DashboardComparisonControls />);

    await user.click(screen.getByRole('button', { name: ACTIVE_REFERENCE_BUTTON }));
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
    setComparison({ enabled: true, referenceSpec: { kind: 'baseline', presetId: '30d' } });
    render(<DashboardComparisonControls />);

    await user.click(screen.getByRole('button', { name: ACTIVE_REFERENCE_BUTTON }));
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
    [{ status: 'finding', candidatePresetId: '30d' } as const, 'Finding comparison…'],
    [{ status: 'no-data' } as const, 'No comparison data'],
    [{ status: 'query-error' } as const, 'Could not find comparison'],
  ])('uses an honest automatic-selection trigger label for $expected', (automaticSelection, expected) => {
    setComparison({
      enabled: true,
      referenceSpec: { kind: 'auto' },
      automaticSelection,
    });

    render(<DashboardComparisonControls />);

    expect(screen.getByRole('button', { name: `Comparison reference, ${expected}` })).toHaveTextContent(expected);
  });

  it('offers retry after automatic selection cannot establish availability', async () => {
    const user = userEvent.setup();
    setComparison({
      enabled: true,
      referenceSpec: { kind: 'auto' },
      automaticSelection: { status: 'query-error' },
    });
    render(<DashboardComparisonControls />);

    await user.click(screen.getByRole('button', { name: 'Comparison reference, Could not find comparison' }));
    await user.click(screen.getByRole('menuitem', { name: 'Retry automatic selection' }));

    expect(comparison.retryAutomaticSelection).toHaveBeenCalledTimes(1);
  });
});
