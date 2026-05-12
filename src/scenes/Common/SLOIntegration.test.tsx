import React from 'react';
import { usePluginComponent } from '@grafana/runtime';
import { screen, waitFor, within } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';

import type { SLO } from './useSLOCheckLinks.types';

import { SLOIntegration } from './SLOIntegration';
import { sloQueryKeys } from './useSLOCheckLinks';

const mockUseSLOsForCheck = jest.fn();
const mockUseDeleteSLO = jest.fn();

jest.mock('./useSLOCheckLinks', () => {
  const actual = jest.requireActual<typeof import('./useSLOCheckLinks')>('./useSLOCheckLinks');
  return {
    ...actual,
    useSLOsForCheck: (...args: unknown[]) => mockUseSLOsForCheck(...args),
    useDeleteSLO: () => mockUseDeleteSLO(),
  };
});

jest.mock('hooks/useMetricsDS', () => ({
  useMetricsDS: () => ({ uid: 'metrics-test-uid', name: 'Prometheus' }),
}));

jest.mock('./SLODetailTab.hooks', () => ({
  useSLOMetrics: () => ({
    sli: 0.999,
    remainingErrorBudget: 0.5,
    burnRate: 1.2,
    isLoading: false,
    isError: false,
  }),
}));

function MockWizard({ onSuccess }: { onSuccess?: () => void }) {
  return (
    <div>
      <span>Mock SLO Wizard</span>
      <button type="button" onClick={() => onSuccess?.()}>
        complete wizard
      </button>
    </div>
  );
}

const makeSLO = (overrides: Partial<SLO> = {}): SLO => ({
  uuid: 'u1',
  name: 'SLO Alpha',
  description: '',
  query: { type: 'freeform', freeform: { query: 'up' } },
  objectives: [{ value: 0.99, window: '7d' }],
  labels: [],
  ...overrides,
});

let defaultDeleteSLO: jest.Mock;

function mockHookReturn(overrides: {
  slos: SLO[];
  isLoading?: boolean;
  error?: undefined;
  deleteSLO?: jest.Mock;
}) {
  mockUseSLOsForCheck.mockReturnValue({
    slos: overrides.slos,
    isLoading: overrides.isLoading ?? false,
    error: overrides.error ?? undefined,
  });
  mockUseDeleteSLO.mockReturnValue(overrides.deleteSLO ?? defaultDeleteSLO);
}

describe('SLOIntegration', () => {
  beforeEach(() => {
    mockUseSLOsForCheck.mockReset();
    mockUseDeleteSLO.mockReset();
    defaultDeleteSLO = jest.fn().mockResolvedValue({ data: {} });
    jest.mocked(usePluginComponent).mockReturnValue({
      isLoading: false,
      component: MockWizard,
    });
  });

  it('opens drawer with wizard when there are no SLOs', async () => {
    mockHookReturn({ slos: [] });

    const { user } = render(<SLOIntegration check={BASIC_HTTP_CHECK} />);

    await user.click(await screen.findByRole('button', { name: /slos/i }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('tab', { name: 'New SLO' })).toBeInTheDocument();
    expect(within(dialog).getByText('Mock SLO Wizard')).toBeInTheDocument();
  });

  it('does not show New SLO tab by default when SLOs exist', async () => {
    const slo = makeSLO({ uuid: 'one', name: 'Only SLO' });
    mockHookReturn({ slos: [slo] });

    const { user } = render(<SLOIntegration check={BASIC_HTTP_CHECK} />);
    await user.click(await screen.findByRole('button', { name: '1 SLO' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('tab', { name: 'Only SLO' })).toBeInTheDocument();
    expect(within(dialog).queryByRole('tab', { name: 'New SLO' })).not.toBeInTheDocument();
  });

  it('adds a New SLO tab when the Create SLO button in the drawer title is clicked', async () => {
    const slo = makeSLO({ uuid: 'one', name: 'Only SLO' });
    mockHookReturn({ slos: [slo] });

    const { user } = render(<SLOIntegration check={BASIC_HTTP_CHECK} />);
    await user.click(await screen.findByRole('button', { name: '1 SLO' }));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /new slo/i }));

    expect(within(dialog).getByRole('tab', { name: 'New SLO' })).toBeInTheDocument();
    expect(within(dialog).getByText('Mock SLO Wizard')).toBeInTheDocument();
  });

  it('invalidates linked-SLO queries when create completes', async () => {
    mockHookReturn({ slos: [] });
    const { queryClient, user } = render(<SLOIntegration check={BASIC_HTTP_CHECK} />);
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries');

    await user.click(await screen.findByRole('button', { name: /slos/i }));
    await user.click(await screen.findByRole('button', { name: /complete wizard/i }));

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: sloQueryKeys.all });
  });

  it('shows "1 SLO" and opens a drawer with one tab and detail content', async () => {
    const slo = makeSLO({ uuid: 'one', name: 'Only SLO' });
    mockHookReturn({ slos: [slo] });

    const { user } = render(<SLOIntegration check={BASIC_HTTP_CHECK} />);
    await user.click(await screen.findByRole('button', { name: '1 SLO' }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Only SLO' })).toBeInTheDocument();
  });

  it('shows "2 SLOs", tabs for each SLO, and switching tabs updates the detail panel', async () => {
    const sloA = makeSLO({ uuid: 'a', name: 'First SLO' });
    const sloB = makeSLO({ uuid: 'b', name: 'Second SLO' });
    mockHookReturn({ slos: [sloA, sloB] });

    const { user } = render(<SLOIntegration check={BASIC_HTTP_CHECK} />);
    await user.click(await screen.findByRole('button', { name: '2 SLOs' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('tab', { name: 'First SLO' })).toHaveAttribute('aria-selected', 'true');

    await user.click(within(dialog).getByRole('tab', { name: 'Second SLO' }));

    expect(within(dialog).getByRole('tab', { name: 'Second SLO' })).toHaveAttribute('aria-selected', 'true');
    expect(within(dialog).getByRole('tab', { name: 'First SLO' })).toHaveAttribute('aria-selected', 'false');
  });

  it('renders the wizard inline within the same SLO tab when Edit is clicked', async () => {
    const slo = makeSLO({ uuid: 'edit-me', name: 'Editable SLO' });
    mockHookReturn({ slos: [slo] });

    const { user } = render(<SLOIntegration check={BASIC_HTTP_CHECK} />);
    await user.click(await screen.findByRole('button', { name: '1 SLO' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('tab', { name: 'Editable SLO' })).toHaveAttribute('aria-selected', 'true');
    expect(within(dialog).queryByText('Mock SLO Wizard')).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Edit' }));

    expect(within(dialog).getByText('Mock SLO Wizard')).toBeInTheDocument();
    expect(within(dialog).getByRole('tab', { name: 'Editable SLO' })).toHaveAttribute('aria-selected', 'true');
  });

  it('renders the Experimental badge in the drawer title', async () => {
    mockHookReturn({ slos: [] });

    const { user } = render(<SLOIntegration check={BASIC_HTTP_CHECK} />);
    await user.click(await screen.findByRole('button', { name: /slos/i }));

    expect(await screen.findByText('Experimental')).toBeInTheDocument();
  });

  it('calls deleteSLO and invalidates queries after confirming deletion', async () => {
    const deleteSLO = jest.fn().mockResolvedValue({ data: {} });
    const slo = makeSLO({ uuid: 'delete-me', name: 'Doomed SLO' });
    mockHookReturn({ slos: [slo], deleteSLO });

    const { queryClient, user } = render(<SLOIntegration check={BASIC_HTTP_CHECK} />);
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries');

    await user.click(await screen.findByRole('button', { name: '1 SLO' }));
    await user.click(await screen.findByRole('button', { name: /delete/i }));
    await user.click(await screen.findByTestId('data-testid Confirm Modal Danger Button'));

    await waitFor(() => {
      expect(deleteSLO).toHaveBeenCalledWith('delete-me');
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: sloQueryKeys.all });
  });

});
