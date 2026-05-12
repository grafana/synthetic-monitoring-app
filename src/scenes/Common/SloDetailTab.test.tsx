import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'test/render';

import type { Slo } from './useSmCheckSlos.types';

import { SloDetailTab } from './SloDetailTab';
import type { SloMetrics } from './SloDetailTab.hooks';

const mockUseSloMetrics = jest.fn<SloMetrics, [Slo]>();

jest.mock('./SloDetailTab.hooks', () => ({
  useSloMetrics: (...args: [Slo]) => mockUseSloMetrics(...args),
}));

const loadedMetrics: SloMetrics = {
  sli: 0.9995,
  remainingErrorBudget: 0.75,
  burnRate: 0.42,
  isLoading: false,
  isError: false,
};

const loadingMetrics: SloMetrics = {
  sli: null,
  remainingErrorBudget: null,
  burnRate: null,
  isLoading: true,
  isError: false,
};

const noDataMetrics: SloMetrics = {
  sli: null,
  remainingErrorBudget: null,
  burnRate: null,
  isLoading: false,
  isError: false,
};

const baseSlo = (overrides: Partial<Slo> = {}): Slo => ({
  uuid: 'slo-uuid-1',
  name: 'Checkout availability',
  description: 'Keeps checkout healthy',
  query: { type: 'ratio', ratio: { successMetric: { prometheusMetric: 'a' }, totalMetric: { prometheusMetric: 'b' } } },
  objectives: [{ value: 0.995, window: '30d' }],
  labels: [
    { key: 'sm_check_id', value: '2319' },
    { key: 'team', value: 'payments' },
  ],
  ...overrides,
});

describe('SloDetailTab', () => {
  beforeEach(() => {
    mockUseSloMetrics.mockReturnValue(loadedMetrics);
  });

  it('does not render the SLO name as a heading', async () => {
    const slo = baseSlo();
    render(<SloDetailTab slo={slo} />);
    await screen.findByText(/99\.5%/);
    expect(screen.queryByRole('heading', { name: 'Checkout availability' })).not.toBeInTheDocument();
  });

  it('renders the description when present', async () => {
    const slo = baseSlo();
    render(<SloDetailTab slo={slo} />);
    expect(await screen.findByText('Keeps checkout healthy')).toBeInTheDocument();
  });

  it('renders objective target and window', async () => {
    const slo = baseSlo();
    render(<SloDetailTab slo={slo} />);
    expect(await screen.findByText(/99\.5%/)).toBeInTheDocument();
    expect(screen.getByText(/Window:/).textContent).toContain('30d');
  });

  it('renders SLI stat card with formatted value', async () => {
    render(<SloDetailTab slo={baseSlo()} />);
    expect(await screen.findByText('30d SLI')).toBeInTheDocument();
    expect(screen.getByText('99.95%')).toBeInTheDocument();
  });

  it('renders remaining error budget stat card', async () => {
    render(<SloDetailTab slo={baseSlo()} />);
    expect(await screen.findByText('Remaining Error Budget')).toBeInTheDocument();
    expect(screen.getByText('75.00%')).toBeInTheDocument();
  });

  it('renders burn rate stat card', async () => {
    render(<SloDetailTab slo={baseSlo()} />);
    expect(await screen.findByText('Current Burn Rate')).toBeInTheDocument();
    expect(screen.getByText('0.42')).toBeInTheDocument();
  });

  it('shows "No data" when metrics return null values', async () => {
    mockUseSloMetrics.mockReturnValue(noDataMetrics);
    render(<SloDetailTab slo={baseSlo()} />);
    const noDataElements = await screen.findAllByText('No data');
    expect(noDataElements).toHaveLength(3);
  });

  it('shows loading placeholders while metrics are loading', async () => {
    mockUseSloMetrics.mockReturnValue(loadingMetrics);
    render(<SloDetailTab slo={baseSlo()} />);
    expect(await screen.findByText('30d SLI')).toBeInTheDocument();
  });

  it('renders sm_check_id label when present', async () => {
    const slo = baseSlo();
    render(<SloDetailTab slo={slo} />);
    expect(await screen.findByText(/sm_check_id:\s*2319/)).toBeInTheDocument();
  });

  it('renders a View dashboard link when drillDownDashboardRef is present', async () => {
    const slo = baseSlo({
      readOnly: { drillDownDashboardRef: { UID: 'dash-abc' }, creationTimestamp: 0 },
    });
    render(<SloDetailTab slo={slo} />);
    const link = await screen.findByRole('link', { name: /view dashboard/i });
    expect(link.getAttribute('href')).toContain('/d/dash-abc');
  });

  it('does not render a View dashboard link when drillDownDashboardRef is absent', async () => {
    const slo = baseSlo();
    render(<SloDetailTab slo={slo} />);
    await screen.findByText(/99\.5%/);
    expect(screen.queryByRole('link', { name: /view dashboard/i })).not.toBeInTheDocument();
  });

  it('calls onEdit with the active slo when Edit is clicked', async () => {
    const slo = baseSlo({ uuid: 'abc-123' });
    const onEdit = jest.fn();
    const user = userEvent.setup();
    render(<SloDetailTab slo={slo} onEdit={onEdit} />);
    await user.click(await screen.findByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(slo);
  });

  it('uses the objective window in the SLI card title', async () => {
    const slo = baseSlo({ objectives: [{ value: 0.999, window: '7d' }] });
    render(<SloDetailTab slo={slo} />);
    expect(await screen.findByText('7d SLI')).toBeInTheDocument();
  });

  it('shows unlinked query-match info and link action when isUnlinkedQueryMatch is true', async () => {
    const slo = baseSlo({ labels: [{ key: 'team', value: 'payments' }] });
    const onLinkToCheck = jest.fn();
    render(<SloDetailTab slo={slo} isUnlinkedQueryMatch onLinkToCheck={onLinkToCheck} />);
    expect(await screen.findByText(/discovered via query match/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/matched by its job label but has no explicit check link/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /link to this check/i })).toBeInTheDocument();
  });

  it('shows linked-to-other-check banner when isLinkedToOtherCheck is true', async () => {
    const slo = baseSlo({
      labels: [
        { key: 'sm_check_id', value: '99999' },
        { key: 'team', value: 'payments' },
      ],
    });
    render(<SloDetailTab slo={slo} isLinkedToOtherCheck onLinkToCheck={jest.fn()} />);
    expect(
      await screen.findByRole('status', { name: 'Linked to a different check' })
    ).toBeInTheDocument();
    expect(screen.getByText(/also filtering on instance/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /link to this check/i })).toBeInTheDocument();
  });

  it('does not show the query-match alert when neither flag is true', async () => {
    const slo = baseSlo({ labels: [{ key: 'team', value: 'payments' }] });
    render(<SloDetailTab slo={slo} isUnlinkedQueryMatch={false} />);
    await screen.findByText(/99\.5%/);
    expect(screen.queryByText(/discovered via query match/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/linked to a different check/i)).not.toBeInTheDocument();
  });

  it('calls onLinkToCheck when Link to this check is clicked', async () => {
    const slo = baseSlo({ labels: [{ key: 'team', value: 'payments' }] });
    const onLinkToCheck = jest.fn();
    const user = userEvent.setup();
    render(<SloDetailTab slo={slo} isUnlinkedQueryMatch onLinkToCheck={onLinkToCheck} />);
    await user.click(await screen.findByRole('button', { name: /link to this check/i }));
    expect(onLinkToCheck).toHaveBeenCalledTimes(1);
  });

  it('disables the link button while isLinking is true', async () => {
    const slo = baseSlo({ labels: [{ key: 'team', value: 'payments' }] });
    render(<SloDetailTab slo={slo} isUnlinkedQueryMatch onLinkToCheck={jest.fn()} isLinking />);
    expect(await screen.findByRole('button', { name: /link to this check/i })).toBeDisabled();
  });

  it('renders a Delete button when onDelete is provided', async () => {
    const slo = baseSlo();
    render(<SloDetailTab slo={slo} onDelete={jest.fn()} />);
    expect(await screen.findByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('does not render a Delete button when onDelete is not provided', async () => {
    const slo = baseSlo();
    render(<SloDetailTab slo={slo} />);
    await screen.findByText(/99\.5%/);
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('shows a confirmation modal when Delete is clicked', async () => {
    const slo = baseSlo();
    const onDelete = jest.fn();
    const user = userEvent.setup();
    render(<SloDetailTab slo={slo} onDelete={onDelete} />);
    await user.click(await screen.findByRole('button', { name: /delete/i }));
    expect(await screen.findByText(/are you sure you want to delete/i)).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('calls onDelete after confirming the deletion', async () => {
    const slo = baseSlo();
    const onDelete = jest.fn();
    const user = userEvent.setup();
    render(<SloDetailTab slo={slo} onDelete={onDelete} />);
    await user.click(await screen.findByRole('button', { name: /delete/i }));
    await user.click(await screen.findByTestId('data-testid Confirm Modal Danger Button'));
    expect(onDelete).toHaveBeenCalledWith(slo);
  });

  it('does not call onDelete when cancel is clicked in the confirmation modal', async () => {
    const slo = baseSlo();
    const onDelete = jest.fn();
    const user = userEvent.setup();
    render(<SloDetailTab slo={slo} onDelete={onDelete} />);
    await user.click(await screen.findByRole('button', { name: /delete/i }));
    await user.click(await screen.findByRole('button', { name: /cancel/i }));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('disables the delete button while isDeleting is true', async () => {
    const slo = baseSlo();
    render(<SloDetailTab slo={slo} onDelete={jest.fn()} isDeleting />);
    expect(await screen.findByRole('button', { name: /delete/i })).toBeDisabled();
  });
});
