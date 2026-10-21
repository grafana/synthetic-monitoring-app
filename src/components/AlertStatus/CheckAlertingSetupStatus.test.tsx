import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import { DB } from 'test/db';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { UNCONFIGURED_NOTIFICATION_CONTACT_POINT } from 'test/fixtures/notificationRouting';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { runTestAsCheckWriterWithoutAlertWrite } from 'test/utils';

import { AlertSensitivity, CheckAlertError, CheckAlertType, CheckType } from 'types';
import { setPendingAlertSetup } from 'data/pendingAlertSetup';
import { getQueryClient } from 'data/queryClient';

import { CheckAlertingSetupStatus } from './CheckAlertingSetupStatus';

const check = { ...BASIC_HTTP_CHECK, alertSensitivity: AlertSensitivity.None };
const failedAlert = DB.alert.build({
  name: CheckAlertType.ProbeFailedExecutionsTooHigh,
  threshold: 1,
  period: '5m',
  status: 'PENDING_CREATE',
  error: CheckAlertError.QuotaLimitReached,
});
const desired = [{ name: CheckAlertType.ProbeFailedExecutionsTooHigh, threshold: 1, period: '5m' }];

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

it('shows disabled per-check alerts from the server', async () => {
  server.use(apiRoute('listAlertsForCheck', { result: () => ({ json: { alerts: [] } }) }));
  render(<CheckAlertingSetupStatus check={check} checkType={CheckType.Http} />);
  expect(await screen.findByText('Per-check alerts are off.')).toBeInTheDocument();
});

it('does not report disabled or enabled when alert configuration cannot be read', async () => {
  server.use(apiRoute('listAlertsForCheck', { result: () => ({ status: 403 }) }));
  render(<CheckAlertingSetupStatus check={check} checkType={CheckType.Http} />);
  expect(await screen.findByText('Alerting status could not be verified')).toBeInTheDocument();
  expect(screen.queryByText('Per-check alerts are off.')).not.toBeInTheDocument();
  expect(screen.queryByText('Alerting enabled')).not.toBeInTheDocument();
});

it('shows incomplete delivery even when the alert rules were created', async () => {
  server.use(
    apiRoute('listAlertsForCheck', {
      result: () => ({ json: { alerts: [{ ...failedAlert, status: 'OK', error: undefined }] } }),
    }),
    apiRoute('listNotificationContactPoints', {
      result: () => ({ json: { items: [UNCONFIGURED_NOTIFICATION_CONTACT_POINT], metadata: {} } }),
    })
  );
  render(<CheckAlertingSetupStatus check={check} checkType={CheckType.Http} />);
  expect(await screen.findByText('Alerting setup is incomplete')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Manage notifications' })).toHaveAttribute('href', '/alerting/routes');
});

it('refreshes server-side retries without sending an unchanged alert configuration', async () => {
  let alerts = [failedAlert];
  const { record, requests } = getServerRequests();
  server.use(
    apiRoute('listAlertsForCheck', { result: () => ({ json: { alerts } }) }),
    apiRoute('updateAlertsForCheck', {}, record)
  );
  const { user } = render(<CheckAlertingSetupStatus check={check} checkType={CheckType.Http} />);
  expect(await screen.findByText(/Quota|quota/)).toBeInTheDocument();
  expect(screen.getByText(/Synthetic Monitoring retries them automatically/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Retry alert creation' })).not.toBeInTheDocument();
  alerts = [{ ...failedAlert, status: 'OK', error: undefined }];
  await user.click(screen.getByRole('button', { name: 'Refresh status' }));
  expect(await screen.findByText('Alerting enabled')).toBeInTheDocument();
  expect(requests).toHaveLength(0);
});

it.each([undefined, CheckAlertError.QuotaLimitReached])(
  'automatically refreshes pending rule creation after backend recovery, previous error: %s',
  async (error) => {
    let alerts = [{ ...failedAlert, error }];
    server.use(apiRoute('listAlertsForCheck', { result: () => ({ json: { alerts } }) }));
    render(<CheckAlertingSetupStatus check={check} checkType={CheckType.Http} />);
    await screen.findByText('Alerting setup is incomplete');
    alerts = [{ ...failedAlert, status: 'OK', error: undefined }];
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5500));
    });
    expect(screen.getByText('Alerting enabled')).toBeInTheDocument();
  },
  10000
);

it('retries a failed save draft and displays server-side creation progress', async () => {
  const queryClient = getQueryClient();
  setPendingAlertSetup(queryClient, check.id!, { alerts: desired, previousAlerts: [] });
  let saved = false;
  const { record, read, requests } = getServerRequests();
  server.use(
    apiRoute('listAlertsForCheck', {
      result: () => ({ json: { alerts: saved ? [{ ...failedAlert, ...desired[0], runbookUrl: undefined }] : [] } }),
    }),
    apiRoute(
      'updateAlertsForCheck',
      {
        result: () => {
          saved = true;
          return { json: null };
        },
      },
      record
    )
  );
  const { user } = render(<CheckAlertingSetupStatus check={check} checkType={CheckType.Http} />, { queryClient });
  await user.click(await screen.findByRole('button', { name: 'Retry alert creation' }));
  expect(await screen.findByText(/Synthetic Monitoring retries them automatically/)).toBeInTheDocument();
  expect((await read()).body).toEqual({ alerts: desired });
  expect(requests).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Refresh status' })).toBeInTheDocument();
  await waitFor(() => expect(localStorage.length).toBe(0));
});

it('does not resend a draft when a fresh retry read confirms the lost save response was successful', async () => {
  const queryClient = getQueryClient();
  setPendingAlertSetup(queryClient, check.id!, { alerts: desired, previousAlerts: [] });
  let saved = false;
  const { record, requests } = getServerRequests();
  server.use(
    apiRoute('listAlertsForCheck', {
      result: () => ({ json: { alerts: saved ? [{ ...failedAlert, ...desired[0], runbookUrl: undefined }] : [] } }),
    }),
    apiRoute('updateAlertsForCheck', {}, record)
  );
  const { user } = render(<CheckAlertingSetupStatus check={check} checkType={CheckType.Http} />, { queryClient });
  const retry = await screen.findByRole('button', { name: 'Retry alert creation' });
  saved = true;
  await user.click(retry);
  expect(await screen.findByText(/Synthetic Monitoring retries them automatically/)).toBeInTheDocument();
  expect(requests).toHaveLength(0);
  await waitFor(() => expect(localStorage.length).toBe(0));
});

it('restores a failed PUT draft after reload and does not overwrite a newer alert configuration', async () => {
  const originalClient = getQueryClient();
  setPendingAlertSetup(originalClient, check.id!, { alerts: desired, previousAlerts: [] });
  originalClient.clear();
  const { record, requests } = getServerRequests();
  server.use(
    apiRoute('listAlertsForCheck', {
      result: () => ({ json: { alerts: [{ ...failedAlert, threshold: 9, status: 'OK', error: undefined }] } }),
    }),
    apiRoute('updateAlertsForCheck', {}, record)
  );
  const { user } = render(<CheckAlertingSetupStatus check={check} checkType={CheckType.Http} />);
  await user.click(await screen.findByRole('button', { name: 'Retry alert creation' }));
  expect(await screen.findByText(/Alert settings changed since this save attempt/)).toBeInTheDocument();
  expect(requests).toHaveLength(0);
});

it.each(['OK', 'PENDING_CREATE'])('clears a saved local draft while the rule status is %s', async (status) => {
  const queryClient = getQueryClient();
  setPendingAlertSetup(queryClient, check.id!, { alerts: desired, previousAlerts: [] });
  server.use(
    apiRoute('listAlertsForCheck', {
      result: () => ({
        json: { alerts: [{ ...failedAlert, ...desired[0], status, error: undefined, runbookUrl: undefined }] },
      }),
    })
  );
  render(<CheckAlertingSetupStatus check={check} checkType={CheckType.Http} />, { queryClient });
  expect(
    await screen.findByText(status === 'OK' ? 'Alerting enabled' : /Synthetic Monitoring retries them automatically/)
  ).toBeInTheDocument();
  await waitFor(() => expect(localStorage.length).toBe(0));
});

it('keeps status visible without offering an unauthorized retry', async () => {
  runTestAsCheckWriterWithoutAlertWrite();
  server.use(apiRoute('listAlertsForCheck', { result: () => ({ json: { alerts: [failedAlert] } }) }));
  render(<CheckAlertingSetupStatus check={check} checkType={CheckType.Http} />);
  expect(await screen.findByText('Alerting setup is incomplete')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Retry alert creation' })).not.toBeInTheDocument();
});
