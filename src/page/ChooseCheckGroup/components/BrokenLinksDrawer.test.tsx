import React from 'react';
import { type Receiver } from '@grafana/api-clients/rtkq/notifications.alerting/v1beta1';
import { getBackendSrv, locationService } from '@grafana/runtime';
import { act, screen, waitFor } from '@testing-library/react';
import { decode } from 'js-base64';
import { COMPLEX_BROWSER_CHECK } from 'test/fixtures/checks';
import {
  DEFAULT_NOTIFICATION_CONTACT_POINT,
  DEFAULT_NOTIFICATION_TREE,
  EXISTING_SM_NOTIFICATION_TREE,
  SECOND_NOTIFICATION_CONTACT_POINT,
  UNCONFIGURED_NOTIFICATION_CONTACT_POINT,
} from 'test/fixtures/notificationRouting';
import { ONLINE_PROBE } from 'test/fixtures/probes';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import {
  mockFeatureToggles,
  runTestAsCheckWriterWithoutAlertWrite,
  runTestAsNotificationSetupWriter,
} from 'test/utils';

import { CheckAlertType, FeatureName } from 'types';
import { ONE_HOUR_IN_MS } from 'utils.constants';

import { BrokenLinksDrawer } from './BrokenLinksDrawer';

beforeEach(() => {
  mockFeatureToggles({ [FeatureName.Folders]: false });
  server.use(
    apiRoute('listAlertsForCheck', { result: () => ({ json: { alerts: [] } }) }),
    apiRoute('listProbes', { result: () => ({ json: [ONLINE_PROBE] }) }),
    apiRoute('addCheck', {
      result: async (req) => ({
        json: { ...COMPLEX_BROWSER_CHECK, ...(await req.json()), id: 123, created: 1700000000 },
      }),
    })
  );
});

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

async function openDrawer() {
  const onClose = jest.fn();
  const result = render(<BrokenLinksDrawer onClose={onClose} />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Create check' })).toBeEnabled());
  return { ...result, onClose };
}

it('creates an hourly check directly with library options and an online probe', async () => {
  const reportInteraction = jest.spyOn(jest.requireMock('@grafana/runtime'), 'reportInteraction');
  const alertRequests = getServerRequests();
  server.use(apiRoute('updateAlertsForCheck', {}, alertRequests.record));
  const { record, read } = getServerRequests();
  server.use(
    apiRoute(
      'addCheck',
      { result: async (req) => ({ json: { ...COMPLEX_BROWSER_CHECK, ...(await req.json()), id: 123 } }) },
      record
    )
  );
  const { user, onClose } = await openDrawer();
  expect(screen.getByRole('textbox', { name: /^Page URL/ })).toBeRequired();
  await user.type(screen.getByRole('textbox', { name: /^Page URL/ }), 'https://grafana.com');
  await user.tab();
  expect(screen.queryByRole('textbox', { name: /^Check name/ })).not.toBeInTheDocument();
  const maxLinks = screen.getByRole('spinbutton', { name: /^Link limit/ });
  await user.clear(maxLinks);
  await user.type(maxLinks, '25');
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(alertRequests.requests).toHaveLength(1);
  const alertRequest = await alertRequests.read();
  expect(alertRequest.request.url).toContain('/sm/check/123/alerts');
  expect(alertRequest.body).toEqual({
    alerts: [{ name: CheckAlertType.ProbeFailedExecutionsTooHigh, threshold: 1, period: '1h' }],
  });
  const { body } = await read();
  expect(body).toMatchObject({
    job: 'Detect broken links on https://grafana.com/',
    target: 'https://grafana.com/',
    frequency: ONE_HOUR_IN_MS,
    timeout: 180000,
    probes: [ONLINE_PROBE.id],
    enabled: true,
  });
  const script = decode(body.settings.browser.script);
  expect(script).toContain('"maxLinks": 25');
  expect(script).not.toContain('"timeout":');
  expect(script).not.toContain('validStatuses');
  expect(script).not.toContain('failOnBroken');
  expect(locationService.getLocation().pathname).toContain('/checks/123');
  expect(reportInteraction).toHaveBeenCalledWith(
    'synthetic-monitoring_check_form_check_created',
    expect.objectContaining({ check_template_id: 'broken_links' })
  );
});

it('validates inputs before sending a check', async () => {
  const { record, requests } = getServerRequests();
  server.use(apiRoute('addCheck', {}, record));
  const { user } = await openDrawer();
  await user.type(screen.getByRole('textbox', { name: /^Page URL/ }), 'ftp://example.com');
  const maximum = screen.getByRole('spinbutton', { name: /^Link limit/ });
  await user.clear(maximum);
  await user.type(maximum, '0');
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  expect(await screen.findByText('Enter a valid URL starting with https:// or http://.')).toBeInTheDocument();
  expect(screen.getByText('Enter a positive whole number.')).toBeInTheDocument();
  expect(requests).toHaveLength(0);
});

it('hints https:// and http:// variants when the Page URL is missing a protocol', async () => {
  const { user } = await openDrawer();
  const urlInput = screen.getByRole('textbox', { name: /^Page URL/ });

  await user.type(urlInput, 'grafana.com');

  expect(await screen.findByText(/Did you mean/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'https://grafana.com' }));

  expect(urlInput).toHaveValue('https://grafana.com');
  expect(screen.queryByText(/Did you mean/)).not.toBeInTheDocument();
  expect(urlInput).toHaveFocus();
});

it('does not hint a protocol for a hostname fragment with no TLD yet', async () => {
  const { user } = await openDrawer();
  const urlInput = screen.getByRole('textbox', { name: /^Page URL/ });

  await user.type(urlInput, 'quick');

  expect(screen.queryByText(/Did you mean/)).not.toBeInTheDocument();
});

it('shows the URL format error live as you type, without requiring a submit click', async () => {
  const { user } = await openDrawer();
  const urlInput = screen.getByRole('textbox', { name: /^Page URL/ });

  await user.type(urlInput, 'quick');

  expect(await screen.findByText('Enter a valid URL starting with https:// or http://.')).toBeInTheDocument();
});

it('rejects a single-label host even with an explicit protocol, matching the stricter validator', async () => {
  const { record, requests } = getServerRequests();
  server.use(apiRoute('addCheck', {}, record));
  const { user } = await openDrawer();

  await user.type(screen.getByRole('textbox', { name: /^Page URL/ }), 'https://quick');
  await user.click(screen.getByRole('button', { name: 'Create check' }));

  expect(await screen.findByText('Enter a valid URL starting with https:// or http://.')).toBeInTheDocument();
  expect(requests).toHaveLength(0);
});

it('preserves inputs on API failure and allows retry', async () => {
  server.use(apiRoute('addCheck', { result: () => ({ status: 500, json: { err: 'Creation failed' } }) }));
  const { user, onClose } = await openDrawer();
  await user.type(screen.getByRole('textbox', { name: /^Page URL/ }), 'https://grafana.com');
  await user.tab();
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  expect(await screen.findByText('Unable to create check')).toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: /^Check name/ })).not.toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
  server.use(apiRoute('addCheck', { result: () => ({ json: COMPLEX_BROWSER_CHECK }) }));
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
});

it('blocks creation when there are no compatible probes', async () => {
  server.use(
    apiRoute('listProbes', {
      result: () => ({
        json: [{ ...ONLINE_PROBE, capabilities: { ...ONLINE_PROBE.capabilities, disableBrowserChecks: true } }],
      }),
    })
  );
  render(<BrokenLinksDrawer onClose={jest.fn()} />);
  expect(await screen.findByText('No compatible probe available')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Create check' })).toBeDisabled();
});

it('uses library defaults when optional settings are empty and preselects a probe without a selector', async () => {
  const { record, read } = getServerRequests();
  server.use(apiRoute('addCheck', { result: () => ({ json: COMPLEX_BROWSER_CHECK }) }, record));
  const { user, onClose } = await openDrawer();
  expect(screen.queryByRole('combobox', { name: 'Probe' })).not.toBeInTheDocument();
  expect(screen.queryByRole('switch', { name: 'Fail on broken links' })).not.toBeInTheDocument();
  expect(screen.getByRole('spinbutton', { name: /^Link limit/ })).toHaveValue(null);
  expect(screen.queryByRole('spinbutton', { name: /^Timeout/ })).not.toBeInTheDocument();
  expect(screen.getByText('Check a page for broken links on a regular schedule.')).toBeInTheDocument();
  expect(await screen.findByRole('checkbox', { name: 'Alert on check failure' })).toBeChecked();
  expect(screen.getByRole('link', { name: 'Manage notifications in Grafana Alerting' })).toHaveAttribute(
    'href',
    '/alerting/routes'
  );
  expect(screen.queryByText('Accepted status codes')).not.toBeInTheDocument();
  await user.type(screen.getByRole('textbox', { name: /^Page URL/ }), 'https://grafana.com');
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  const { body } = await read();
  expect(body.probes).toEqual([ONLINE_PROBE.id]);
  expect(body.timeout).toBe(180000);
  expect(decode(body.settings.browser.script)).toContain('await checkLinks(page, {});');
});

it('generates a valid name from the latest URL on submit without requiring blur', async () => {
  const { record, read } = getServerRequests();
  server.use(apiRoute('addCheck', { result: () => ({ json: COMPLEX_BROWSER_CHECK }) }, record));
  const { user, onClose } = await openDrawer();
  const url = screen.getByRole('textbox', { name: /^Page URL/ });
  await user.type(url, 'https://grafana.com');
  await user.clear(url);
  await user.type(url, 'https://example.com/path?q=a,b' + 'x'.repeat(150));
  await user.keyboard('{Enter}');
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  const { body } = await read();
  expect(body.job).toMatch(/^Detect broken links on https:\/\/example.com\/path\?q=a%2Cb/);
  expect(body.job.length).toBeLessThanOrEqual(128);
  expect(body.target).toBe('https://example.com/path?q=a,b' + 'x'.repeat(150));
});

it('numbers duplicate names for the same URL and refreshes the list after a concurrent conflict', async () => {
  const backend = getBackendSrv();
  const fetch = jest.spyOn(backend, 'fetch');
  jest.spyOn(jest.requireMock('@grafana/runtime'), 'getBackendSrv').mockReturnValue(backend);
  const base = 'Detect broken links on https://grafana.com/';
  const { record, read, requests } = getServerRequests();
  let listReads = 0;
  server.use(
    apiRoute('listChecks', {
      result: () => {
        listReads++;
        return {
          json: [
            { ...COMPLEX_BROWSER_CHECK, job: base, target: 'https://grafana.com/' },
            { ...COMPLEX_BROWSER_CHECK, id: 999, job: `${base} (2)`, target: 'https://grafana.com/' },
          ],
        };
      },
    }),
    apiRoute(
      'addCheck',
      {
        result: async (req) =>
          requests.length === 1
            ? { status: 409, json: { err: 'target/job combination already exists' } }
            : { json: { ...COMPLEX_BROWSER_CHECK, ...(await req.json()) } },
      },
      record
    )
  );
  const { user, onClose } = await openDrawer();
  await user.type(screen.getByRole('textbox', { name: /^Page URL/ }), 'https://grafana.com');
  await user.type(screen.getByRole('spinbutton', { name: /^Link limit/ }), '5');
  const beforeSubmit = listReads;
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(requests).toHaveLength(2);
  expect(listReads - beforeSubmit).toBeGreaterThanOrEqual(2);
  const creationRequests = fetch.mock.calls
    .map(([request]) => request)
    .filter(({ url }) => url.endsWith('/sm/check/add'));
  expect(creationRequests).toHaveLength(2);
  expect(creationRequests.every(({ showErrorAlert }) => showErrorAlert === false)).toBe(true);
  expect((await read()).body.job).toBe(`${base} (3)`);
  const { body } = await read(1);
  expect(body).toMatchObject({ job: `${base} (4)`, target: 'https://grafana.com/', timeout: 180000 });
  expect(decode(body.settings.browser.script)).toContain('"maxLinks": 5');
  expect(screen.queryByRole('textbox', { name: /^Check name/ })).not.toBeInTheDocument();
  expect(screen.queryByText('Unable to create check')).not.toBeInTheDocument();
});

it('stops after three duplicate conflicts and preserves the inputs for retry', async () => {
  const { record, requests } = getServerRequests();
  server.use(
    apiRoute(
      'addCheck',
      {
        result: () => ({ status: 409, json: { err: 'target/job combination already exists' } }),
      },
      record
    )
  );
  const { user, onClose } = await openDrawer();
  await user.type(screen.getByRole('textbox', { name: /^Page URL/ }), 'https://grafana.com');
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  expect(await screen.findByText('Unable to create check')).toBeInTheDocument();
  expect(requests).toHaveLength(3);
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByRole('textbox', { name: /^Page URL/ })).toHaveValue('https://grafana.com');
  expect(screen.getByRole('button', { name: 'Create check' })).toBeEnabled();
});

it.each([500, 409] as const)('does not retry an unrelated creation error with status %s', async (status) => {
  const { record, requests } = getServerRequests();
  server.use(apiRoute('addCheck', { result: () => ({ status, json: { err: 'Creation failed' } }) }, record));
  const { user } = await openDrawer();
  await user.type(screen.getByRole('textbox', { name: /^Page URL/ }), 'https://grafana.com');
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  expect(await screen.findByText('Unable to create check')).toBeInTheDocument();
  expect(requests).toHaveLength(1);
});

it('keeps creation busy through list refreshes and alert setup', async () => {
  const beforeAlerts = deferred();
  const alertResponse = deferred();
  const afterAlerts = deferred();
  const alerts = getServerRequests();
  server.use(
    apiRoute(
      'updateAlertsForCheck',
      {
        result: async () => {
          await alertResponse.promise;
          return { json: null };
        },
      },
      alerts.record
    )
  );
  const { user, onClose, queryClient } = await openDrawer();
  const invalidate = jest
    .spyOn(queryClient, 'invalidateQueries')
    .mockImplementationOnce(() => beforeAlerts.promise)
    .mockImplementationOnce(() => afterAlerts.promise);

  const expectBusy = () => {
    expect(screen.getByRole('button', { name: 'Create check' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Retry alerting setup' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View check' })).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  };
  await user.type(screen.getByRole('textbox', { name: /^Page URL/ }), 'https://grafana.com');
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(1));
  expectBusy();
  expect(alerts.requests).toHaveLength(0);
  await user.keyboard('{Escape}');
  expect(onClose).not.toHaveBeenCalled();

  await act(async () => beforeAlerts.resolve());
  await waitFor(() => expect(alerts.requests).toHaveLength(1));
  expectBusy();

  await act(async () => alertResponse.resolve());
  await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(2));
  expectBusy();
  await user.keyboard('{Escape}');
  expect(onClose).not.toHaveBeenCalled();

  await act(async () => afterAlerts.resolve());
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(alerts.requests).toHaveLength(1);
  expect(locationService.getLocation().pathname).toContain('/checks/123');
});

it('retries alert setup after partial success without creating another check', async () => {
  const checks = getServerRequests();
  const alerts = getServerRequests();
  server.use(
    apiRoute(
      'addCheck',
      { result: async (req) => ({ json: { ...COMPLEX_BROWSER_CHECK, ...(await req.json()), id: 123 } }) },
      checks.record
    ),
    apiRoute(
      'updateAlertsForCheck',
      { result: () => ({ status: 500, json: { err: 'Alert service unavailable' } }) },
      alerts.record
    )
  );
  const { user, onClose, queryClient } = await openDrawer();
  await user.type(screen.getByRole('textbox', { name: /^Page URL/ }), 'https://grafana.com');
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  expect(await screen.findByText('Check created, but alerting setup is incomplete')).toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
  expect(checks.requests).toHaveLength(1);
  expect(screen.getByRole('textbox', { name: /^Page URL/ })).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Create check' })).not.toBeInTheDocument();
  const refreshed = deferred();
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries').mockImplementationOnce(() => refreshed.promise);
  server.use(apiRoute('updateAlertsForCheck', {}, alerts.record));
  await user.click(screen.getByRole('button', { name: 'Retry alerting setup' }));
  await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(1));
  expect(screen.getByRole('button', { name: 'Create check' })).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Retry alerting setup' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'View check' })).not.toBeInTheDocument();
  await user.keyboard('{Escape}');
  expect(onClose).not.toHaveBeenCalled();
  await act(async () => refreshed.resolve());
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(checks.requests).toHaveLength(1);
  expect(alerts.requests).toHaveLength(2);
  expect((await alerts.read(1)).request.url).toContain('/sm/check/123/alerts');
});

it('allows opening the created check after alert setup fails', async () => {
  server.use(apiRoute('updateAlertsForCheck', { result: () => ({ status: 500, json: { err: 'Unavailable' } }) }));
  const { user, onClose } = await openDrawer();
  await user.type(screen.getByRole('textbox', { name: /^Page URL/ }), 'https://grafana.com');
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  await screen.findByText('Check created, but alerting setup is incomplete');
  await user.click(screen.getByRole('button', { name: 'View check' }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(locationService.getLocation().pathname).toContain('/checks/123');
});

it('explains missing alert permissions and still creates the check without alert requests', async () => {
  runTestAsCheckWriterWithoutAlertWrite();
  const alerts = getServerRequests();
  server.use(apiRoute('updateAlertsForCheck', {}, alerts.record));
  const { user, onClose } = await openDrawer();
  expect(
    screen.getByText(/You don’t have permission to configure alerts. This check will be created without them/)
  ).toBeInTheDocument();
  await user.type(screen.getByRole('textbox', { name: /^Page URL/ }), 'https://grafana.com');
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(alerts.requests).toHaveLength(0);
});

it('allows opting out of template alerts without writing alert or notification configuration', async () => {
  const alerts = getServerRequests();
  const receivers = getServerRequests();
  const policies = getServerRequests();
  server.use(
    apiRoute('updateAlertsForCheck', {}, alerts.record),
    apiRoute('createNotificationContactPoint', {}, receivers.record),
    apiRoute('updateNotificationRoutingTree', {}, policies.record)
  );
  const { user, onClose } = await openDrawer();
  await user.click(await screen.findByRole('checkbox', { name: 'Alert on check failure' }));
  expect(screen.getByRole('status')).toHaveTextContent('Alerts are off for this check.');
  expect(screen.queryByRole('link', { name: 'Manage notifications in Grafana Alerting' })).not.toBeInTheDocument();
  await user.type(screen.getByRole('textbox', { name: /^Page URL/ }), 'https://grafana.com');
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(alerts.requests).toHaveLength(0);
  expect(receivers.requests).toHaveLength(0);
  expect(policies.requests).toHaveLength(0);
});

it('shows destinations from fixed template labels before a URL is entered', async () => {
  server.use(
    apiRoute('listNotificationContactPoints', {
      result: () => ({
        json: { items: [DEFAULT_NOTIFICATION_CONTACT_POINT, SECOND_NOTIFICATION_CONTACT_POINT], metadata: {} },
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
                    matchers: [{ label: 'namespace', type: '=', value: 'synthetic_monitoring' }],
                    receiver: 'grafana-default-email',
                    continue: true,
                  },
                  {
                    matchers: [{ label: 'check_name', type: '=', value: 'browser' }],
                    receiver: SECOND_NOTIFICATION_CONTACT_POINT.spec.title,
                    continue: false,
                  },
                ],
              },
            },
          ],
          metadata: {},
        },
      }),
    })
  );
  await openDrawer();
  expect(screen.getByRole('textbox', { name: /^Page URL/ })).toHaveValue('');
  expect(await screen.findByRole('link', { name: 'grafana-default-email' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: SECOND_NOTIFICATION_CONTACT_POINT.spec.title })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Show routing|See labels/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Default policy' })).not.toBeInTheDocument();
});

it.each([
  { label: 'job', value: 'Detect broken links on https://grafana.com/' },
  { label: 'instance', value: 'https://grafana.com/' },
])('updates the destination when the URL changes a matching $label', async ({ label, value }) => {
  server.use(
    apiRoute('listNotificationContactPoints', {
      result: () => ({
        json: { items: [DEFAULT_NOTIFICATION_CONTACT_POINT, SECOND_NOTIFICATION_CONTACT_POINT], metadata: {} },
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
                    matchers: [{ label, type: '=', value }],
                    receiver: SECOND_NOTIFICATION_CONTACT_POINT.spec.title,
                    continue: false,
                  },
                ],
              },
            },
          ],
          metadata: {},
        },
      }),
    })
  );
  const { user } = await openDrawer();
  expect(await screen.findByRole('link', { name: 'grafana-default-email' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: SECOND_NOTIFICATION_CONTACT_POINT.spec.title })).not.toBeInTheDocument();
  const input = screen.getByRole('textbox', { name: /^Page URL/ });
  await user.type(input, 'https://grafana.com');
  expect(await screen.findByRole('link', { name: SECOND_NOTIFICATION_CONTACT_POINT.spec.title })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'grafana-default-email' })).not.toBeInTheDocument();
  await user.clear(input);
  expect(await screen.findByRole('link', { name: 'grafana-default-email' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: SECOND_NOTIFICATION_CONTACT_POINT.spec.title })).not.toBeInTheDocument();
});

it('saves directly when routing is unavailable and keeps the inline warning', async () => {
  const checks = getServerRequests();
  server.use(
    apiRoute('listNotificationRoutingTrees', { result: () => ({ status: 403 }) }),
    apiRoute('addCheck', {}, checks.record)
  );
  const { user, onClose } = await openDrawer();
  await user.type(screen.getByRole('textbox', { name: /^Page URL/ }), 'https://grafana.com');
  expect(await screen.findByText('Couldn’t verify notification destinations.')).toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: /Email addresses/ })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(screen.queryByRole('dialog', { name: 'Continue with incomplete alerting setup?' })).not.toBeInTheDocument();
  expect(checks.requests).toHaveLength(1);
});

it('keeps existing policy branches intact and saves directly without notification setup', async () => {
  runTestAsNotificationSetupWriter();
  const policies = getServerRequests();
  const checks = getServerRequests();
  server.use(
    apiRoute('listNotificationContactPoints', {
      result: () => ({ json: { items: [UNCONFIGURED_NOTIFICATION_CONTACT_POINT], metadata: {} } }),
    }),
    apiRoute('listNotificationRoutingTrees', {
      result: () => ({ json: { items: [EXISTING_SM_NOTIFICATION_TREE], metadata: {} } }),
    }),
    apiRoute('updateNotificationRoutingTree', {}, policies.record),
    apiRoute('addCheck', {}, checks.record)
  );
  const { user, onClose } = await openDrawer();
  await user.type(screen.getByRole('textbox', { name: /^Page URL/ }), 'https://grafana.com');
  expect(await screen.findByText('No notification destination configured.')).toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: /Email addresses/ })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(screen.queryByRole('dialog', { name: 'Continue with incomplete alerting setup?' })).not.toBeInTheDocument();
  expect(checks.requests).toHaveLength(1);
  expect(policies.requests).toHaveLength(0);
});

it('validates recipients and retries a failed shared policy write without recreating the check or contact point', async () => {
  runTestAsNotificationSetupWriter();
  let tree = DEFAULT_NOTIFICATION_TREE;
  const receivers: Receiver[] = [UNCONFIGURED_NOTIFICATION_CONTACT_POINT];
  const checks = getServerRequests();
  const alerts = getServerRequests();
  const contactPoints = getServerRequests();
  const policies = getServerRequests();
  server.use(
    apiRoute('listNotificationRoutingTrees', { result: () => ({ json: { items: [tree], metadata: {} } }) }),
    apiRoute('listNotificationContactPoints', { result: () => ({ json: { items: receivers, metadata: {} } }) }),
    apiRoute(
      'createNotificationContactPoint',
      {
        result: async (req) => {
          const receiver: Receiver = { ...(await req.json()), metadata: { name: 'sm-email', resourceVersion: '1' } };
          receivers.push(receiver);
          return { json: receiver };
        },
      },
      contactPoints.record
    ),
    apiRoute('updateNotificationRoutingTree', { result: () => ({ status: 500 }) }, policies.record),
    apiRoute(
      'addCheck',
      { result: async (req) => ({ json: { ...COMPLEX_BROWSER_CHECK, ...(await req.json()), id: 123 } }) },
      checks.record
    ),
    apiRoute('updateAlertsForCheck', {}, alerts.record)
  );
  const { user, onClose } = await openDrawer();
  await user.type(screen.getByRole('textbox', { name: /^Page URL/ }), 'https://grafana.com');
  const emails = await screen.findByRole('textbox', { name: /Email addresses/ });
  await user.type(emails, 'unfinished');
  expect(screen.queryByText(/Enter valid email addresses/)).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  expect(await screen.findByText(/Enter valid email addresses/)).toBeInTheDocument();
  expect(checks.requests).toHaveLength(0);
  await user.clear(emails);
  await user.type(emails, 'oncall@example.com, team@example.com');
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  expect(await screen.findByText('Check created, but alerting setup is incomplete')).toBeInTheDocument();
  expect(checks.requests).toHaveLength(1);
  expect(contactPoints.requests).toHaveLength(1);
  expect(alerts.requests).toHaveLength(1);
  expect((await contactPoints.read()).body.spec.integrations[0].settings.addresses).toBe(
    'oncall@example.com;team@example.com'
  );
  server.use(
    apiRoute(
      'updateNotificationRoutingTree',
      {
        result: async (req) => {
          tree = await req.json();
          return { json: tree };
        },
      },
      policies.record
    )
  );
  await user.click(screen.getByRole('button', { name: 'Retry alerting setup' }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(checks.requests).toHaveLength(1);
  expect(contactPoints.requests).toHaveLength(1);
  expect(alerts.requests).toHaveLength(1);
  expect(policies.requests).toHaveLength(2);
  expect(tree.spec.defaults).toEqual(DEFAULT_NOTIFICATION_TREE.spec.defaults);
  expect(tree.spec.routes).toEqual([expect.objectContaining({ receiver: 'Synthetic Monitoring email' })]);
});

it('rechecks routing after a name conflict changes the created check', async () => {
  const checks = getServerRequests();
  let attempt = 0;
  server.use(
    apiRoute('listNotificationContactPoints', {
      result: () => ({
        json: { items: [UNCONFIGURED_NOTIFICATION_CONTACT_POINT, SECOND_NOTIFICATION_CONTACT_POINT], metadata: {} },
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
                    matchers: [{ label: 'job', type: '=', value: 'Detect broken links on https://grafana.com/' }],
                    receiver: SECOND_NOTIFICATION_CONTACT_POINT.spec.title,
                    continue: false,
                  },
                ],
              },
            },
          ],
          metadata: {},
        },
      }),
    }),
    apiRoute(
      'addCheck',
      {
        result: async (req) => {
          attempt++;
          if (attempt === 1) {
            return { status: 409, json: { err: 'target/job combination already exists' } };
          }
          return { json: { ...COMPLEX_BROWSER_CHECK, ...(await req.json()), id: 123 } };
        },
      },
      checks.record
    )
  );
  const { user, onClose } = await openDrawer();
  await user.type(screen.getByRole('textbox', { name: /^Page URL/ }), 'https://grafana.com');
  expect(await screen.findByRole('link', { name: SECOND_NOTIFICATION_CONTACT_POINT.spec.title })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  expect(await screen.findByText('Check created, but alerting setup is incomplete')).toBeInTheDocument();
  expect(screen.getByText(/Alerts may fire without notifying anyone/)).toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
  expect(checks.requests).toHaveLength(2);
  expect((await checks.read(1)).body.job).toBe('Detect broken links on https://grafana.com/ (2)');
  await user.click(screen.getByRole('button', { name: 'View check' }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
});
