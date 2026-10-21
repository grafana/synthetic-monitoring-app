import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import { DB } from 'test/db';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import {
  DEFAULT_NOTIFICATION_TREE,
  MULTI_DESTINATION_NOTIFICATION_TREE,
  SECOND_NOTIFICATION_CONTACT_POINT,
  UNCONFIGURED_NOTIFICATION_CONTACT_POINT,
} from 'test/fixtures/notificationRouting';
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

it.each([
  { state: 'off', alerts: [] },
  { state: 'configured', alerts: [{ ...failedAlert, status: 'OK', error: undefined }] },
])('shows no status block when alerts are $state', async ({ alerts }) => {
  server.use(apiRoute('listAlertsForCheck', { result: () => ({ json: { alerts } }) }));
  const { queryClient } = render(
    <div data-testid="alerting-status">
      <CheckAlertingSetupStatus check={check} checkType={CheckType.Http} />
    </div>
  );
  expect(await screen.findByTestId('alerting-status')).toBeEmptyDOMElement();
  await waitFor(() => expect(queryClient.getQueryState(['alertsForCheck', check.id])?.status).toBe('success'));
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  expect(screen.getByTestId('alerting-status')).toBeEmptyDOMElement();
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
  expect(screen.getByText(/Notifications have no usable destination/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Manage notifications' })).toHaveAttribute('href', '/alerting/routes');
});

it('reports partial notification setup when a continued branch has a configured contact point', async () => {
  server.use(
    apiRoute('listAlertsForCheck', {
      result: () => ({ json: { alerts: [{ ...failedAlert, status: 'OK', error: undefined }] } }),
    }),
    apiRoute('listNotificationRoutingTrees', {
      result: () => ({ json: { items: [MULTI_DESTINATION_NOTIFICATION_TREE], metadata: {} } }),
    }),
    apiRoute('listNotificationContactPoints', {
      result: () => ({
        json: { items: [UNCONFIGURED_NOTIFICATION_CONTACT_POINT, SECOND_NOTIFICATION_CONTACT_POINT], metadata: {} },
      }),
    })
  );
  render(<CheckAlertingSetupStatus check={check} checkType={CheckType.Http} />);
  expect(await screen.findByText(/Some notification destinations are not configured/)).toBeInTheDocument();
  expect(screen.queryByText(/Notifications have no usable destination/)).not.toBeInTheDocument();
});

it.each([
  { state: 'configured', contactPoints: [UNCONFIGURED_NOTIFICATION_CONTACT_POINT, SECOND_NOTIFICATION_CONTACT_POINT] },
  { state: 'unverified', contactPoints: [UNCONFIGURED_NOTIFICATION_CONTACT_POINT] },
])('does not claim all destinations are unusable when another alert’s routing is $state', async ({ contactPoints }) => {
  server.use(
    apiRoute('listAlertsForCheck', {
      result: () => ({
        json: {
          alerts: [
            { ...failedAlert, status: 'OK', error: undefined },
            {
              ...failedAlert,
              name: CheckAlertType.TLSTargetCertificateCloseToExpiring,
              threshold: 30,
              period: undefined,
              status: 'OK',
              error: undefined,
            },
          ],
        },
      }),
    }),
    apiRoute('listNotificationRoutingTrees', {
      result: () => ({
        json: {
          items: [
            {
              ...DEFAULT_NOTIFICATION_TREE,
              spec: {
                ...DEFAULT_NOTIFICATION_TREE.spec,
                routes: [
                  {
                    matchers: [
                      { label: 'alertname', type: '=', value: CheckAlertType.TLSTargetCertificateCloseToExpiring },
                    ],
                    receiver: SECOND_NOTIFICATION_CONTACT_POINT.spec.title,
                  },
                ],
              },
            },
          ],
          metadata: {},
        },
      }),
    }),
    apiRoute('listNotificationContactPoints', {
      result: () => ({ json: { items: contactPoints, metadata: {} } }),
    })
  );
  render(<CheckAlertingSetupStatus check={check} checkType={CheckType.Http} />);
  expect(await screen.findByText(/Some notification destinations are not configured/)).toBeInTheDocument();
  expect(screen.queryByText(/Notifications have no usable destination/)).not.toBeInTheDocument();
});

it('refreshes server-side retries without sending an unchanged alert configuration', async () => {
  let alerts = [failedAlert];
  const { record, requests } = getServerRequests();
  server.use(
    apiRoute('listAlertsForCheck', { result: () => ({ json: { alerts } }) }),
    apiRoute('updateAlertsForCheck', {}, record)
  );
  const { user } = render(<CheckAlertingSetupStatus check={check} checkType={CheckType.Http} />);
  expect(await screen.findByText(/Failed Checks: The alerting limit has been reached/)).toBeInTheDocument();
  expect(screen.queryByText(new RegExp(failedAlert.name))).not.toBeInTheDocument();
  expect(screen.queryByText(/quota limit reached|PENDING_CREATE/)).not.toBeInTheDocument();
  expect(screen.getByText(/Synthetic Monitoring retries them automatically/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Retry alert creation' })).not.toBeInTheDocument();
  alerts = [{ ...failedAlert, status: 'OK', error: undefined }];
  await user.click(screen.getByRole('button', { name: 'Refresh status' }));
  await waitFor(() => expect(screen.queryByText('Alerting setup is incomplete')).not.toBeInTheDocument());
  expect(screen.queryByRole('link', { name: 'Edit alerts' })).not.toBeInTheDocument();
  expect(requests).toHaveLength(0);
});

it.each([undefined, CheckAlertError.QuotaLimitReached])(
  'automatically refreshes pending rule creation after backend recovery, previous error: %s',
  async (error) => {
    let alerts = [{ ...failedAlert, error }];
    server.use(apiRoute('listAlertsForCheck', { result: () => ({ json: { alerts } }) }));
    render(<CheckAlertingSetupStatus check={check} checkType={CheckType.Http} />);
    await screen.findByText('Alerting setup is incomplete');
    expect(screen.queryByText(/PENDING_CREATE/)).not.toBeInTheDocument();
    alerts = [{ ...failedAlert, status: 'OK', error: undefined }];
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5500));
    });
    expect(screen.queryByText('Alerting setup is incomplete')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Edit alerts' })).not.toBeInTheDocument();
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

it('shows a helpful message when retrying fails without displaying the raw API error', async () => {
  const queryClient = getQueryClient();
  setPendingAlertSetup(queryClient, check.id!, { alerts: desired, previousAlerts: [] });
  const rawError = 'rpc error: code = Internal desc = upstream request failed';
  server.use(
    apiRoute('listAlertsForCheck', { result: () => ({ json: { alerts: [] } }) }),
    apiRoute('updateAlertsForCheck', { result: () => ({ status: 500, json: { err: rawError } }) })
  );
  const { user } = render(<CheckAlertingSetupStatus check={check} checkType={CheckType.Http} />, { queryClient });
  await user.click(await screen.findByRole('button', { name: 'Retry alert creation' }));
  expect(
    await screen.findByText('Alerts could not be saved. Try again or review the alert settings.')
  ).toBeInTheDocument();
  expect(screen.queryByText(rawError)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Retry alert creation' })).toBeEnabled();
  expect(screen.getByRole('link', { name: 'Edit alerts' })).toBeInTheDocument();
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
  await waitFor(() => expect(localStorage.length).toBe(0));
  if (status === 'OK') {
    await waitFor(() => expect(screen.queryByText('Alerting setup is incomplete')).not.toBeInTheDocument());
    expect(screen.queryByRole('link', { name: 'Edit alerts' })).not.toBeInTheDocument();
  } else {
    expect(await screen.findByText(/Synthetic Monitoring retries them automatically/)).toBeInTheDocument();
  }
});

it('keeps status visible without offering an unauthorized retry', async () => {
  runTestAsCheckWriterWithoutAlertWrite();
  server.use(apiRoute('listAlertsForCheck', { result: () => ({ json: { alerts: [failedAlert] } }) }));
  render(<CheckAlertingSetupStatus check={check} checkType={CheckType.Http} />);
  expect(await screen.findByText('Alerting setup is incomplete')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Retry alert creation' })).not.toBeInTheDocument();
});
