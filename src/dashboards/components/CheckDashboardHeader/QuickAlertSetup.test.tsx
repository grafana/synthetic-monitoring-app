import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';
import { BASIC_CHECK_ALERTS } from 'test/fixtures/checkAlerts';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { CheckAlertType } from 'types';
import { useListAlertsForCheck, useUpdateAlertsForCheck } from 'data/useCheckAlerts';

import { QuickAlertSetup } from './QuickAlertSetup';

jest.mock('data/useCheckAlerts', () => ({
  ...jest.requireActual('data/useCheckAlerts'),
  useListAlertsForCheck: jest.fn(),
  useUpdateAlertsForCheck: jest.fn(),
}));

jest.mock('hooks/useMetricsDS', () => ({
  useMetricsDS: jest.fn(() => undefined),
}));

jest.mock('hooks/useURLSearchParams', () => ({
  useURLSearchParams: jest.fn(() => new URLSearchParams()),
}));

const updateAlerts = jest.fn();
const check = { ...BASIC_HTTP_CHECK, id: 96, frequency: 60_000 };

function renderSetup(alertType = CheckAlertType.HTTPRequestDurationTooHighAvg) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  jest.mocked(useListAlertsForCheck).mockReturnValue({
    data: [
      {
        ...BASIC_CHECK_ALERTS.alerts.find(
          (alert) => alert.name === CheckAlertType.ProbeFailedExecutionsTooHigh
        )!,
        threshold: 1,
        period: '5m',
        runbookUrl: undefined,
      },
    ],
  } as ReturnType<typeof useListAlertsForCheck>);
  jest.mocked(useUpdateAlertsForCheck).mockReturnValue({
    mutateAsync: updateAlerts,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateAlertsForCheck>);

  return render(
    <QueryClientProvider client={queryClient}>
      <QuickAlertSetup check={check} alertType={alertType} onSaved={jest.fn()} />
    </QueryClientProvider>
  );
}

describe('QuickAlertSetup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateAlerts.mockResolvedValue(null);
  });

  it('preserves other alerts in the mutation payload', async () => {
    const user = userEvent.setup();

    renderSetup();
    await user.click(screen.getByRole('button', { name: 'Save alert' }));

    expect(updateAlerts).toHaveBeenCalledWith({
      checkId: 96,
      alerts: [
        {
          name: CheckAlertType.ProbeFailedExecutionsTooHigh,
          threshold: 1,
          period: '5m',
          runbookUrl: undefined,
        },
        {
          name: CheckAlertType.HTTPRequestDurationTooHighAvg,
          threshold: 300,
          period: '5m',
        },
      ],
    });
  });

  it('shows shared validation errors before mutating', async () => {
    const user = userEvent.setup();

    renderSetup(CheckAlertType.ProbeFailedExecutionsTooHigh);
    const threshold = screen.getByTestId(
      CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.ProbeFailedExecutionsTooHigh].thresholdInput
    );
    await user.clear(threshold);
    await user.type(threshold, '999');
    await user.click(screen.getByRole('button', { name: 'Save alert' }));

    expect(screen.getByText(/must be lower than or equal to the total number of checks/)).toBeVisible();
    expect(updateAlerts).not.toHaveBeenCalled();
  });

  it('keeps the form open and reports a failed mutation', async () => {
    const user = userEvent.setup();
    updateAlerts.mockRejectedValueOnce(new Error('Save failed'));

    renderSetup();
    await user.click(screen.getByRole('button', { name: 'Save alert' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Save failed');
    expect(screen.getByRole('dialog', { name: 'Set up Average latency alert' })).toBeVisible();
  });

  it('starts in view mode for existing alerts and reveals the form on edit', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const existing = BASIC_CHECK_ALERTS.alerts.find(
      (alert) => alert.name === CheckAlertType.HTTPRequestDurationTooHighAvg
    )!;

    jest.mocked(useListAlertsForCheck).mockReturnValue({
      data: [existing],
    } as ReturnType<typeof useListAlertsForCheck>);
    jest.mocked(useUpdateAlertsForCheck).mockReturnValue({
      mutateAsync: updateAlerts,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateAlertsForCheck>);

    render(
      <QueryClientProvider client={queryClient}>
        <QuickAlertSetup
          alertType={CheckAlertType.HTTPRequestDurationTooHighAvg}
          check={check}
          mode="edit"
          onSaved={jest.fn()}
        />
      </QueryClientProvider>
    );

    expect(screen.getByRole('dialog', { name: 'View Average latency alert' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Save alert' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit alert' }));

    expect(screen.getByRole('dialog', { name: 'Edit Average latency alert' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save alert' })).toBeVisible();
  });
});
