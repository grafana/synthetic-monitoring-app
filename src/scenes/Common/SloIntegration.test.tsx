import React from 'react';
import { usePluginComponent } from '@grafana/runtime';
import { screen, within } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';

import type { Slo } from './useSmCheckSlos.types';

import { SloIntegration } from './SloIntegration';
import { smCheckSlosQueryKeys } from './useSmCheckSlos';

const mockUseSmCheckSlos = jest.fn();

jest.mock('./useSmCheckSlos', () => {
  const actual = jest.requireActual<typeof import('./useSmCheckSlos')>('./useSmCheckSlos');
  return {
    ...actual,
    useSmCheckSlos: (...args: unknown[]) => mockUseSmCheckSlos(...args),
  };
});

jest.mock('hooks/useMetricsDS', () => ({
  useMetricsDS: () => ({ uid: 'metrics-test-uid', name: 'Prometheus' }),
}));

jest.mock('./SloDetailTab.hooks', () => ({
  useSloMetrics: () => ({
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

const makeSlo = (overrides: Partial<Slo> = {}): Slo => ({
  uuid: 'u1',
  name: 'SLO Alpha',
  description: '',
  query: { type: 'freeform', freeform: { query: 'up' } },
  objectives: [{ value: 0.99, window: '7d' }],
  labels: [{ key: 'sm_check_id', value: String(BASIC_HTTP_CHECK.id) }],
  ...overrides,
});

describe('SloIntegration', () => {
  beforeEach(() => {
    mockUseSmCheckSlos.mockReset();
    jest.mocked(usePluginComponent).mockReturnValue({
      isLoading: false,
      component: MockWizard,
    });
  });

  it('opens drawer with wizard when there are no SLOs', async () => {
    mockUseSmCheckSlos.mockReturnValue({ slos: [], isLoading: false, error: undefined });

    const { user } = render(<SloIntegration check={BASIC_HTTP_CHECK} />);

    await user.click(await screen.findByRole('button', { name: /slos/i }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('tab', { name: 'New SLO' })).toBeInTheDocument();
    expect(within(dialog).getByText('Mock SLO Wizard')).toBeInTheDocument();
  });

  it('does not show New SLO tab by default when SLOs exist', async () => {
    const slo = makeSlo({ uuid: 'one', name: 'Only SLO' });
    mockUseSmCheckSlos.mockReturnValue({ slos: [slo], isLoading: false, error: undefined });

    const { user } = render(<SloIntegration check={BASIC_HTTP_CHECK} />);
    await user.click(await screen.findByRole('button', { name: '1 SLO' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('tab', { name: 'Only SLO' })).toBeInTheDocument();
    expect(within(dialog).queryByRole('tab', { name: 'New SLO' })).not.toBeInTheDocument();
  });

  it('adds a New SLO tab when the Create SLO button in the drawer title is clicked', async () => {
    const slo = makeSlo({ uuid: 'one', name: 'Only SLO' });
    mockUseSmCheckSlos.mockReturnValue({ slos: [slo], isLoading: false, error: undefined });

    const { user } = render(<SloIntegration check={BASIC_HTTP_CHECK} />);
    await user.click(await screen.findByRole('button', { name: '1 SLO' }));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /create slo/i }));

    expect(within(dialog).getByRole('tab', { name: 'New SLO' })).toBeInTheDocument();
    expect(within(dialog).getByText('Mock SLO Wizard')).toBeInTheDocument();
  });

  it('invalidates linked-SLO queries when create completes', async () => {
    mockUseSmCheckSlos.mockReturnValue({ slos: [], isLoading: false, error: undefined });
    const { queryClient, user } = render(<SloIntegration check={BASIC_HTTP_CHECK} />);
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries');

    await user.click(await screen.findByRole('button', { name: /slos/i }));
    await user.click(await screen.findByRole('button', { name: /complete wizard/i }));

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: smCheckSlosQueryKeys.all });
  });

  it('shows "1 SLO" and opens a drawer with one tab and detail content', async () => {
    const slo = makeSlo({ uuid: 'one', name: 'Only SLO' });
    mockUseSmCheckSlos.mockReturnValue({ slos: [slo], isLoading: false, error: undefined });

    const { user } = render(<SloIntegration check={BASIC_HTTP_CHECK} />);
    await user.click(await screen.findByRole('button', { name: '1 SLO' }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Only SLO' })).toBeInTheDocument();
  });

  it('shows "2 SLOs", tabs for each SLO, and switching tabs updates the detail panel', async () => {
    const sloA = makeSlo({ uuid: 'a', name: 'First SLO' });
    const sloB = makeSlo({ uuid: 'b', name: 'Second SLO' });
    mockUseSmCheckSlos.mockReturnValue({ slos: [sloA, sloB], isLoading: false, error: undefined });

    const { user } = render(<SloIntegration check={BASIC_HTTP_CHECK} />);
    await user.click(await screen.findByRole('button', { name: '2 SLOs' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('tab', { name: 'First SLO' })).toHaveAttribute('aria-selected', 'true');

    await user.click(within(dialog).getByRole('tab', { name: 'Second SLO' }));

    expect(within(dialog).getByRole('tab', { name: 'Second SLO' })).toHaveAttribute('aria-selected', 'true');
    expect(within(dialog).getByRole('tab', { name: 'First SLO' })).toHaveAttribute('aria-selected', 'false');
  });

  it('renders the wizard inline within the same SLO tab when Edit is clicked', async () => {
    const slo = makeSlo({ uuid: 'edit-me', name: 'Editable SLO' });
    mockUseSmCheckSlos.mockReturnValue({ slos: [slo], isLoading: false, error: undefined });

    const { user } = render(<SloIntegration check={BASIC_HTTP_CHECK} />);
    await user.click(await screen.findByRole('button', { name: '1 SLO' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('tab', { name: 'Editable SLO' })).toHaveAttribute('aria-selected', 'true');
    expect(within(dialog).queryByText('Mock SLO Wizard')).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Edit' }));

    expect(within(dialog).getByText('Mock SLO Wizard')).toBeInTheDocument();
    expect(within(dialog).getByRole('tab', { name: 'Editable SLO' })).toHaveAttribute('aria-selected', 'true');
  });

  it('renders the Experimental badge in the drawer title', async () => {
    mockUseSmCheckSlos.mockReturnValue({ slos: [], isLoading: false, error: undefined });

    const { user } = render(<SloIntegration check={BASIC_HTTP_CHECK} />);
    await user.click(await screen.findByRole('button', { name: /slos/i }));

    expect(await screen.findByText('Experimental')).toBeInTheDocument();
  });
});
