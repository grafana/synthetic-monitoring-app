import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'test/render';

import type { SLO } from './useSLOCheckLinks.types';

import { SLODetailTab } from './SLODetailTab';
import type { SLOMetrics } from './SLODetailTab.hooks';

const mockUseSLOMetrics = jest.fn<SLOMetrics, [SLO]>();

jest.mock('./SLODetailTab.hooks', () => ({
  useSLOMetrics: (...args: [SLO]) => mockUseSLOMetrics(...args),
}));

const loadedMetrics: SLOMetrics = {
  sli: 0.9995,
  remainingErrorBudget: 0.75,
  burnRate: 0.42,
  isLoading: false,
  isError: false,
};

const loadingMetrics: SLOMetrics = {
  sli: null,
  remainingErrorBudget: null,
  burnRate: null,
  isLoading: true,
  isError: false,
};

const noDataMetrics: SLOMetrics = {
  sli: null,
  remainingErrorBudget: null,
  burnRate: null,
  isLoading: false,
  isError: false,
};

const baseSLO = (overrides: Partial<SLO> = {}): SLO => ({
  uuid: 'slo-uuid-1',
  name: 'Checkout availability',
  description: 'Keeps checkout healthy',
  query: { type: 'ratio', ratio: { successMetric: { prometheusMetric: 'a' }, totalMetric: { prometheusMetric: 'b' } } },
  objectives: [{ value: 0.995, window: '30d' }],
  labels: [
    { key: 'team', value: 'payments' },
  ],
  ...overrides,
});

describe('SLODetailTab', () => {
  beforeEach(() => {
    mockUseSLOMetrics.mockReturnValue(loadedMetrics);
  });

  it('does not render the SLO name as a heading', async () => {
    const slo = baseSLO();
    render(<SLODetailTab slo={slo} />);
    await screen.findByText(/99\.5%/);
    expect(screen.queryByRole('heading', { name: 'Checkout availability' })).not.toBeInTheDocument();
  });

  it('renders the description when present', async () => {
    const slo = baseSLO();
    render(<SLODetailTab slo={slo} />);
    expect(await screen.findByText('Keeps checkout healthy')).toBeInTheDocument();
  });

  it('renders objective target and window', async () => {
    const slo = baseSLO();
    render(<SLODetailTab slo={slo} />);
    expect(await screen.findByText(/99\.5%/)).toBeInTheDocument();
    expect(screen.getByText(/Window:/).textContent).toContain('30d');
  });

  it('renders SLI stat card with formatted value', async () => {
    render(<SLODetailTab slo={baseSLO()} />);
    expect(await screen.findByText('30d SLI')).toBeInTheDocument();
    expect(screen.getByText('99.95%')).toBeInTheDocument();
  });

  it('renders remaining error budget stat card', async () => {
    render(<SLODetailTab slo={baseSLO()} />);
    expect(await screen.findByText('Remaining Error Budget')).toBeInTheDocument();
    expect(screen.getByText('75.00%')).toBeInTheDocument();
  });

  it('renders burn rate stat card', async () => {
    render(<SLODetailTab slo={baseSLO()} />);
    expect(await screen.findByText('Current Burn Rate')).toBeInTheDocument();
    expect(screen.getByText('0.42')).toBeInTheDocument();
  });

  it('shows "No data" when metrics return null values', async () => {
    mockUseSLOMetrics.mockReturnValue(noDataMetrics);
    render(<SLODetailTab slo={baseSLO()} />);
    const noDataElements = await screen.findAllByText('No data');
    expect(noDataElements).toHaveLength(3);
  });

  it('shows loading placeholders while metrics are loading', async () => {
    mockUseSLOMetrics.mockReturnValue(loadingMetrics);
    render(<SLODetailTab slo={baseSLO()} />);
    expect(await screen.findByText('30d SLI')).toBeInTheDocument();
  });

  it('renders a View dashboard link when drillDownDashboardRef is present', async () => {
    const slo = baseSLO({
      readOnly: { drillDownDashboardRef: { UID: 'dash-abc' }, creationTimestamp: 0 },
    });
    render(<SLODetailTab slo={slo} />);
    const link = await screen.findByRole('link', { name: /view dashboard/i });
    expect(link.getAttribute('href')).toContain('/d/dash-abc');
  });

  it('does not render a View dashboard link when drillDownDashboardRef is absent', async () => {
    const slo = baseSLO();
    render(<SLODetailTab slo={slo} />);
    await screen.findByText(/99\.5%/);
    expect(screen.queryByRole('link', { name: /view dashboard/i })).not.toBeInTheDocument();
  });

  it('calls onEdit with the active slo when Edit is clicked', async () => {
    const slo = baseSLO({ uuid: 'abc-123' });
    const onEdit = jest.fn();
    const user = userEvent.setup();
    render(<SLODetailTab slo={slo} onEdit={onEdit} />);
    await user.click(await screen.findByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(slo);
  });

  it('uses the objective window in the SLI card title', async () => {
    const slo = baseSLO({ objectives: [{ value: 0.999, window: '7d' }] });
    render(<SLODetailTab slo={slo} />);
    expect(await screen.findByText('7d SLI')).toBeInTheDocument();
  });

  it('renders a Delete button when onDelete is provided', async () => {
    const slo = baseSLO();
    render(<SLODetailTab slo={slo} onDelete={jest.fn()} />);
    expect(await screen.findByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('does not render a Delete button when onDelete is not provided', async () => {
    const slo = baseSLO();
    render(<SLODetailTab slo={slo} />);
    await screen.findByText(/99\.5%/);
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('shows a confirmation modal when Delete is clicked', async () => {
    const slo = baseSLO();
    const onDelete = jest.fn();
    const user = userEvent.setup();
    render(<SLODetailTab slo={slo} onDelete={onDelete} />);
    await user.click(await screen.findByRole('button', { name: /delete/i }));
    expect(await screen.findByText(/are you sure you want to delete/i)).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('calls onDelete after confirming the deletion', async () => {
    const slo = baseSLO();
    const onDelete = jest.fn();
    const user = userEvent.setup();
    render(<SLODetailTab slo={slo} onDelete={onDelete} />);
    await user.click(await screen.findByRole('button', { name: /delete/i }));
    await user.click(await screen.findByTestId('data-testid Confirm Modal Danger Button'));
    expect(onDelete).toHaveBeenCalledWith(slo);
  });

  it('does not call onDelete when cancel is clicked in the confirmation modal', async () => {
    const slo = baseSLO();
    const onDelete = jest.fn();
    const user = userEvent.setup();
    render(<SLODetailTab slo={slo} onDelete={onDelete} />);
    await user.click(await screen.findByRole('button', { name: /delete/i }));
    await user.click(await screen.findByRole('button', { name: /cancel/i }));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('disables the delete button while isDeleting is true', async () => {
    const slo = baseSLO();
    render(<SLODetailTab slo={slo} onDelete={jest.fn()} isDeleting />);
    expect(await screen.findByRole('button', { name: /delete/i })).toBeDisabled();
  });
});
