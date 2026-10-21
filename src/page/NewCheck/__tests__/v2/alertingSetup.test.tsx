import React from 'react';
import { type Receiver, type RoutingTree } from '@grafana/api-clients/rtkq/notifications.alerting/v1beta1';
import { act, screen, waitFor, within } from '@testing-library/react';
import { CHECKSTER_TEST_ID, ROUTER_TEST_ID } from 'test/dataTestIds';
import { notificationContactPointFactory } from 'test/factories/notificationContactPoint';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import {
  DEFAULT_NOTIFICATION_CONTACT_POINT,
  DEFAULT_NOTIFICATION_TREE,
  EMPTY_NOTIFICATION_CONTACT_POINT,
  EMPTY_NOTIFICATION_TREE,
  EXISTING_SM_NOTIFICATION_TREE,
  NON_SM_NOTIFICATION_TREE,
  PLACEHOLDER_NOTIFICATION_CONTACT_POINT,
  PROVISIONED_NOTIFICATION_TREE,
  UNCONFIGURED_NOTIFICATION_CONTACT_POINT,
} from 'test/fixtures/notificationRouting';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { runTestAsCheckWriterWithoutAlertWrite, runTestAsNotificationSetupWriter, runTestAsSMEditor } from 'test/utils';

import { CheckAlertType, CheckType } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath, getRoute } from 'routing/utils';
import { notificationRoutingQueryKey } from 'data/useNotificationRouting';
import { gotoSection, submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { FormSectionName } from 'components/Checkster/types';
import { renderNewForm } from 'page/__testHelpers__/checkForm';
import { fillMandatoryFields } from 'page/__testHelpers__/v2.utils';
import { NewCheckV2 } from 'page/NewCheck/NewCheckV2';

const defaultAlert = { name: CheckAlertType.ProbeFailedExecutionsTooHigh, threshold: 1, period: '5m' };

beforeEach(() => {
  runTestAsNotificationSetupWriter();
  localStorage.clear();
});
afterEach(() => localStorage.clear());

function mockInitialRouting(
  initialTree = DEFAULT_NOTIFICATION_TREE,
  initialReceiver = UNCONFIGURED_NOTIFICATION_CONTACT_POINT
) {
  let tree = initialTree;
  const contactPoints: Receiver[] = [initialReceiver];
  const creates = jest.fn();
  const updates = jest.fn();
  server.use(
    apiRoute('listNotificationRoutingTrees', { result: () => ({ json: { items: [tree], metadata: {} } }) }),
    apiRoute('listNotificationContactPoints', { result: () => ({ json: { items: contactPoints, metadata: {} } }) }),
    apiRoute('createNotificationContactPoint', {
      result: async (req) => {
        const body: Receiver = await req.json();
        const created = { ...body, metadata: { name: 'sm-email', resourceVersion: '1' } };
        creates(body);
        contactPoints.push(created);
        return { json: created };
      },
    }),
    apiRoute('updateNotificationRoutingTree', {
      result: async (req) => {
        tree = await req.json();
        updates(tree);
        return { json: tree };
      },
    })
  );
  return {
    creates,
    updates,
    contactPoints,
    changeTree: (updated: RoutingTree) => {
      tree = updated;
    },
  };
}

async function readyForm() {
  const result = await renderNewForm(CheckType.Http);
  await fillMandatoryFields({ user: result.user, checkType: CheckType.Http });
  await gotoSection(result.user, FormSectionName.Alerting);
  return result;
}

it('enables Failed Checks for a new WebSocket example', async () => {
  const { user } = render(<NewCheckV2 />, {
    path: `${generateRoutePath(AppRoutes.NewCheck)}/scripted?checkType=scripted&example=websocket`,
    route: `${getRoute(AppRoutes.NewCheck)}/:checkTypeGroup`,
  });
  await screen.findByTestId(CHECKSTER_TEST_ID.navigation.root);
  await gotoSection(user, FormSectionName.Alerting);
  expect(await screen.findByRole('checkbox', { name: 'Failed Checks' })).toBeChecked();
});

it('previews regex routing and saves without a routing warning or changing existing policies', async () => {
  const namespacePattern = 'synthetic_.*';
  const alertPattern = 'ProbeFailedExecutionsTooHigh \\[5m\\]';
  const routing = mockInitialRouting({
    ...DEFAULT_NOTIFICATION_TREE,
    spec: {
      ...DEFAULT_NOTIFICATION_TREE.spec,
      routes: [
        {
          matchers: [{ label: 'namespace', type: '=~', value: namespacePattern }],
          receiver: 'SM team',
          continue: false,
          routes: [{ matchers: [{ label: 'alertname', type: '=~', value: alertPattern }], continue: false }],
        },
        // This branch cannot be reached, so its unknown label must not prevent
        // previewing or saving the check with its already-configured destination.
        { matchers: [{ label: 'runtime_label', type: '=', value: 'unknown' }], continue: false },
      ],
    },
  });
  routing.contactPoints.push(notificationContactPointFactory.build({ spec: { title: 'SM team' } }));
  const { user, read } = await readyForm();
  const failureAlert = screen.getByRole('group', { name: 'Failed Checks' });
  expect(await within(failureAlert).findByRole('link', { name: 'SM team' })).toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: /Email addresses/ })).not.toBeInTheDocument();
  await user.click(within(failureAlert).getByRole('button', { name: 'Show routing for Failed Checks' }));
  const details = within(failureAlert).getByRole('region', { name: 'Failed Checks notification routing' });
  expect(within(details).getByRole('link', { name: `namespace=~${namespacePattern}` })).toBeInTheDocument();
  expect(within(details).getByRole('link', { name: `alertname=~${alertPattern}` })).toBeInTheDocument();
  await user.click(within(details).getByRole('button', { name: 'See labels' }));
  expect(within(details).getByLabelText('namespace: synthetic_monitoring')).toHaveTextContent(
    'namespace = synthetic_monitoring'
  );

  await submitForm(user);
  expect((await read(1)).body).toEqual({ alerts: [defaultAlert] });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(routing.creates).not.toHaveBeenCalled();
  expect(routing.updates).not.toHaveBeenCalled();
});

it.each([
  { label: 'namespace', type: '=~' as const, value: '(?P<kind>synthetic)_monitoring' },
  { label: 'label_per_check_alerts', type: '=' as const, value: 'true' },
])('requires explicit continuation for unverified routing: %j', async (matcher) => {
  const routing = mockInitialRouting(
    {
      ...DEFAULT_NOTIFICATION_TREE,
      spec: {
        ...DEFAULT_NOTIFICATION_TREE.spec,
        routes: [
          {
            matchers: [matcher],
            receiver: 'SM team',
            continue: false,
          },
        ],
      },
    },
    DEFAULT_NOTIFICATION_CONTACT_POINT
  );
  routing.contactPoints.push(notificationContactPointFactory.build({ spec: { title: 'SM team' } }));
  const { user, read } = await readyForm();
  const failureAlert = screen.getByRole('group', { name: 'Failed Checks' });
  expect(await within(failureAlert).findByText(/Notification routing could not be verified/)).toBeInTheDocument();
  expect(within(failureAlert).queryByRole('link', { name: 'grafana-default-email' })).not.toBeInTheDocument();
  const checks = jest.fn();
  server.use(apiRoute('addCheck', {}, checks));
  await submitForm(user);
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByText(/Notification routing is incomplete or could not be verified/)).toBeInTheDocument();
  expect(checks).not.toHaveBeenCalled();
  await user.click(within(dialog).getByRole('button', { name: 'Save check anyway' }));
  expect((await read()).body).toEqual({ alerts: [defaultAlert] });
  expect(routing.creates).not.toHaveBeenCalled();
  expect(routing.updates).not.toHaveBeenCalled();
});

it.each(['oncall@example.com', 'unfinished'])(
  'preserves the visible recipient draft %s through a failed background lookup and recovery',
  async (draft) => {
    const routing = mockInitialRouting();
    const { user, queryClient } = await readyForm();
    await user.type(await screen.findByRole('textbox', { name: /Email addresses/ }), draft);
    server.use(apiRoute('listNotificationContactPoints', { result: () => ({ status: 500 }) }));
    await act(() => queryClient.invalidateQueries({ queryKey: notificationRoutingQueryKey() }));
    expect(await screen.findByText('Notification setup could not be verified')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Email addresses/ })).toHaveValue(draft);
    server.use(
      apiRoute('listNotificationContactPoints', {
        result: () => ({ json: { items: routing.contactPoints, metadata: {} } }),
      })
    );
    await user.click(screen.getByRole('button', { name: 'Retry notification lookup' }));
    expect(await screen.findByText('Set up notifications for Synthetic Monitoring')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Email addresses/ })).toHaveValue(draft);
    expect(routing.creates).not.toHaveBeenCalled();
  }
);

it('preserves a recipient draft when a refreshed resource list cannot establish setup eligibility', async () => {
  mockInitialRouting();
  const { user, queryClient } = await readyForm();
  await user.type(await screen.findByRole('textbox', { name: /Email addresses/ }), 'oncall@example.com');
  server.use(apiRoute('listNotificationContactPoints', { result: () => ({ json: { items: [], metadata: {} } }) }));
  await act(() => queryClient.invalidateQueries({ queryKey: notificationRoutingQueryKey() }));
  expect(await screen.findByText('Notification setup could not be verified')).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: /Email addresses/ })).toHaveValue('oncall@example.com');
  await submitForm(user);
  expect(await screen.findByRole('dialog')).toHaveTextContent('Notification setup is no longer available here.');
});

it('enables failed checks by default and creates shared email routing on save without changing the default', async () => {
  const routing = mockInitialRouting(NON_SM_NOTIFICATION_TREE);
  const { user, read } = await readyForm();
  expect(screen.getByRole('checkbox', { name: 'Failed Checks' })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'TLS Certificate' })).not.toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Latency' })).not.toBeChecked();
  await user.type(await screen.findByRole('textbox', { name: /Email addresses/ }), 'one@example.com, two@example.com');
  expect(routing.creates).not.toHaveBeenCalled();
  await submitForm(user);
  await waitFor(() => expect(routing.updates).toHaveBeenCalledTimes(1));
  expect((await read(1)).body).toEqual({ alerts: [defaultAlert] });
  expect(routing.creates).toHaveBeenCalledWith(
    expect.objectContaining({
      metadata: {},
      spec: {
        title: 'Synthetic Monitoring email',
        integrations: [{ type: 'email', version: 'v1', settings: { addresses: 'one@example.com;two@example.com' } }],
      },
    })
  );
  const written = routing.updates.mock.calls[0][0];
  expect(written.metadata.resourceVersion).toBe(NON_SM_NOTIFICATION_TREE.metadata.resourceVersion);
  expect(written.spec.defaults).toEqual(NON_SM_NOTIFICATION_TREE.spec.defaults);
  expect(written.spec.routes[0]).toEqual(NON_SM_NOTIFICATION_TREE.spec.routes[0]);
  expect(written.spec.routes[1]).toEqual({
    continue: false,
    receiver: 'Synthetic Monitoring email',
    matchers: [{ label: 'namespace', type: '=', value: 'synthetic_monitoring' }],
  });
});

it.each([EXISTING_SM_NOTIFICATION_TREE, PROVISIONED_NOTIFICATION_TREE])(
  'does not offer shared setup over an existing SM or provisioned policy',
  async (tree) => {
    const routing = mockInitialRouting(tree);
    const { user } = await readyForm();
    expect(await screen.findByText('No notification destination configured')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /Email addresses/ })).not.toBeInTheDocument();
    await submitForm(user);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Notification routing is incomplete/)).toBeInTheDocument();
    expect(routing.creates).not.toHaveBeenCalled();
    expect(routing.updates).not.toHaveBeenCalled();
  }
);

it('requires explicit continuation when setup is skipped', async () => {
  const routing = mockInitialRouting();
  const { user, read } = await readyForm();
  const checks = jest.fn();
  server.use(apiRoute('addCheck', {}, checks));
  await submitForm(user);
  const dialog = await screen.findByRole('dialog');
  expect(checks).not.toHaveBeenCalled();
  await user.click(within(dialog).getByRole('button', { name: 'Save check anyway' }));
  await waitFor(() => expect(checks).toHaveBeenCalledTimes(1));
  expect((await read()).body).toEqual({ alerts: [defaultAlert] });
  expect(routing.creates).not.toHaveBeenCalled();
});

it('validates email addresses before creating a check', async () => {
  mockInitialRouting();
  const { user } = await readyForm();
  const checks = jest.fn();
  server.use(apiRoute('addCheck', {}, checks));
  await user.type(await screen.findByRole('textbox', { name: /Email addresses/ }), 'one@example.com, not-an-email');
  expect(screen.queryByText(/Enter valid email addresses/)).not.toBeInTheDocument();
  await submitForm(user);
  expect(await screen.findByText(/Enter valid email addresses/)).toBeInTheDocument();
  expect(checks).not.toHaveBeenCalled();
});

it('waits until blur to validate email drafts and clears errors when editing resumes', async () => {
  const routing = mockInitialRouting();
  const { user } = await readyForm();
  const emails = await screen.findByRole('textbox', { name: /Email addresses/ });
  const message = /Enter valid email addresses/;

  await user.click(emails);
  await user.keyboard('one');
  expect(screen.queryByText(message)).not.toBeInTheDocument();
  await user.keyboard('@example.com, tw');
  expect(screen.queryByText(message)).not.toBeInTheDocument();
  await user.tab();
  expect(await screen.findByText(message)).toBeInTheDocument();

  await user.click(emails);
  await user.keyboard('o');
  expect(screen.queryByText(message)).not.toBeInTheDocument();
  await user.tab();
  expect(await screen.findByText(message)).toBeInTheDocument();

  await user.click(emails);
  await user.keyboard('@example.com');
  expect(screen.queryByText(message)).not.toBeInTheDocument();
  await user.tab();
  expect(screen.queryByText(message)).not.toBeInTheDocument();
  await gotoSection(user, FormSectionName.Execution);
  await gotoSection(user, FormSectionName.Alerting);
  expect(await screen.findByRole('textbox', { name: /Email addresses/ })).toHaveValue(
    'one@example.com, two@example.com'
  );
  await submitForm(user);
  await waitFor(() => expect(routing.creates).toHaveBeenCalledTimes(1));
  expect(routing.creates.mock.calls[0][0].spec.integrations[0].settings.addresses).toBe(
    'one@example.com;two@example.com'
  );
});

it('removes an invalid email draft if a policy change makes shared setup unavailable', async () => {
  const routing = mockInitialRouting();
  const { user, queryClient } = await readyForm();
  await user.type(await screen.findByRole('textbox', { name: /Email addresses/ }), 'unfinished');
  await user.tab();
  expect(await screen.findByText(/Enter valid email addresses/)).toBeInTheDocument();

  routing.changeTree(EXISTING_SM_NOTIFICATION_TREE);
  await act(() => queryClient.invalidateQueries({ queryKey: notificationRoutingQueryKey() }));
  await waitFor(() => expect(screen.queryByRole('textbox', { name: /Email addresses/ })).not.toBeInTheDocument());
  expect(screen.queryByText(/Enter valid email addresses/)).not.toBeInTheDocument();
  await submitForm(user);
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByRole('button', { name: 'Save check anyway' })).toBeInTheDocument();
  expect(routing.creates).not.toHaveBeenCalled();
});

it('retries failed alert creation for the saved check without creating another check', async () => {
  const { user } = await readyForm();
  const checks = jest.fn();
  const { record, read } = getServerRequests();
  let attempts = 0;
  server.use(
    apiRoute('addCheck', {}, checks),
    apiRoute('listAlertsForCheck', { result: () => ({ json: { alerts: [] } }) }),
    apiRoute(
      'updateAlertsForCheck',
      {
        result: () =>
          ++attempts === 1 ? { status: 500, json: { err: 'Unable to create alert rules' } } : { json: null },
      },
      record
    )
  );
  await submitForm(user);
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByText('Check saved. Alerting setup is incomplete.')).toBeInTheDocument();
  expect(checks).toHaveBeenCalledTimes(1);
  await user.click(within(dialog).getByRole('button', { name: 'Retry alerting setup' }));
  await waitFor(() =>
    expect(screen.getByTestId(ROUTER_TEST_ID.pathname)).toHaveTextContent(`/checks/${BASIC_HTTP_CHECK.id}`)
  );
  expect(checks).toHaveBeenCalledTimes(1);
  expect(attempts).toBe(2);
  expect((await read(1)).body).toEqual({ alerts: [defaultAlert] });
});

it('recovers a lost alert save response without resending the saved configuration', async () => {
  const { user } = await readyForm();
  const checks = jest.fn();
  const updates = jest.fn();
  server.use(
    apiRoute('addCheck', {}, checks),
    apiRoute('listAlertsForCheck', {
      result: () => ({
        json: { alerts: [{ ...defaultAlert, created: 1, modified: 1, status: 'PENDING_CREATE' }] },
      }),
    }),
    apiRoute('updateAlertsForCheck', { result: () => ({ status: 500, json: { err: 'Connection lost' } }) }, updates)
  );
  await submitForm(user);
  const dialog = await screen.findByRole('dialog');
  await user.click(within(dialog).getByRole('button', { name: 'Retry alerting setup' }));
  await waitFor(() =>
    expect(screen.getByTestId(ROUTER_TEST_ID.pathname)).toHaveTextContent(`/checks/${BASIC_HTTP_CHECK.id}`)
  );
  expect(checks).toHaveBeenCalledTimes(1);
  expect(updates).toHaveBeenCalledTimes(1);
  expect(localStorage.length).toBe(0);
});

it('preserves a created contact point after a policy conflict and reuses it on an explicit retry', async () => {
  const routing = mockInitialRouting();
  const { user } = await readyForm();
  let routeAttempts = 0;
  server.use(
    apiRoute('updateNotificationRoutingTree', {
      result: async (req) => {
        if (++routeAttempts === 1) {
          return { status: 409, json: { message: 'conflict' } };
        }
        const tree: RoutingTree = await req.json();
        routing.changeTree(tree);
        return { json: tree };
      },
    })
  );
  await user.type(await screen.findByRole('textbox', { name: /Email addresses/ }), 'one@example.com');
  await submitForm(user);
  const dialog = await screen.findByRole('dialog');
  expect(routing.creates).toHaveBeenCalledTimes(1);
  await user.click(within(dialog).getByRole('button', { name: 'Retry alerting setup' }));
  await waitFor(() => expect(routeAttempts).toBe(2));
  expect(routing.creates).toHaveBeenCalledTimes(1);
});

it('does not install a shared route when another user adds an SM policy during setup', async () => {
  const routing = mockInitialRouting();
  const { user } = await readyForm();
  server.use(
    apiRoute('createNotificationContactPoint', {
      result: async (req) => {
        const body: Receiver = await req.json();
        const created = { ...body, metadata: { name: 'sm-email' } };
        routing.contactPoints.push(created);
        routing.changeTree(EXISTING_SM_NOTIFICATION_TREE);
        return { json: created };
      },
    })
  );
  await user.type(await screen.findByRole('textbox', { name: /Email addresses/ }), 'one@example.com');
  await submitForm(user);
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByText(/notification routing changed/)).toBeInTheDocument();
  expect(routing.updates).not.toHaveBeenCalled();
});

it.each([
  { tree: DEFAULT_NOTIFICATION_TREE, receiver: PLACEHOLDER_NOTIFICATION_CONTACT_POINT },
  { tree: EMPTY_NOTIFICATION_TREE, receiver: EMPTY_NOTIFICATION_CONTACT_POINT },
])('offers initial setup for Grafana shipped empty and placeholder defaults', async ({ tree, receiver }) => {
  mockInitialRouting(tree, receiver);
  await readyForm();
  expect(await screen.findByRole('textbox', { name: /Email addresses/ })).toBeInTheDocument();
});

it('allows an explicit opt-out without configuring notifications', async () => {
  const routing = mockInitialRouting();
  const { user, read } = await readyForm();
  await user.click(screen.getByRole('checkbox', { name: 'Failed Checks' }));
  expect(screen.queryByRole('textbox', { name: /Email addresses/ })).not.toBeInTheDocument();
  await submitForm(user);
  expect((await read(1)).body).toEqual({ alerts: [] });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(routing.creates).not.toHaveBeenCalled();
});

it('requires explicit continuation when routing is unreadable', async () => {
  const routing = mockInitialRouting();
  server.use(apiRoute('listNotificationRoutingTrees', { result: () => ({ status: 403 }) }));
  const { user } = await readyForm();
  const checks = jest.fn();
  server.use(apiRoute('addCheck', {}, checks));
  await submitForm(user);
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByText(/Notification routing could not be inspected/)).toBeInTheDocument();
  expect(checks).not.toHaveBeenCalled();
  await user.click(within(dialog).getByRole('button', { name: 'Save check anyway' }));
  await waitFor(() => expect(checks).toHaveBeenCalledTimes(1));
  expect(routing.creates).not.toHaveBeenCalled();
});

it('does not offer initial setup without permission to manage notifications', async () => {
  runTestAsSMEditor();
  mockInitialRouting();
  await readyForm();
  expect(await screen.findByText(/Ask an administrator to configure a destination/)).toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: /Email addresses/ })).not.toBeInTheDocument();
});

it('allows check creation without alert permissions and exposes the incomplete setup', async () => {
  runTestAsCheckWriterWithoutAlertWrite();
  const { user } = await readyForm();
  const checks = jest.fn();
  const alerts = jest.fn();
  server.use(apiRoute('addCheck', {}, checks), apiRoute('updateAlertsForCheck', {}, alerts));
  await submitForm(user);
  const dialog = await screen.findByRole('dialog');
  expect(checks).not.toHaveBeenCalled();
  await user.click(within(dialog).getByRole('button', { name: 'Save check anyway' }));
  expect(await screen.findByText('Check saved. Alerting setup is incomplete.')).toBeInTheDocument();
  expect(checks).toHaveBeenCalledTimes(1);
  expect(alerts).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Continue to check' }));
  await waitFor(() =>
    expect(screen.getByTestId(ROUTER_TEST_ID.pathname)).toHaveTextContent(`/checks/${BASIC_HTTP_CHECK.id}`)
  );
});

it('reuses the receiver when its creation response was lost', async () => {
  const routing = mockInitialRouting();
  const creates = jest.fn();
  server.use(
    apiRoute(
      'createNotificationContactPoint',
      {
        result: async (req) => {
          const body: Receiver = await req.json();
          routing.contactPoints.push({ ...body, metadata: { name: 'sm-email', resourceVersion: '1' } });
          return { status: 500, json: { message: 'Connection interrupted' } };
        },
      },
      creates
    )
  );
  const { user } = await readyForm();
  await user.type(await screen.findByRole('textbox', { name: /Email addresses/ }), 'one@example.com');
  await submitForm(user);
  const dialog = await screen.findByRole('dialog');
  await user.click(within(dialog).getByRole('button', { name: 'Retry alerting setup' }));
  await waitFor(() => expect(routing.updates).toHaveBeenCalledTimes(1));
  expect(creates).toHaveBeenCalledTimes(1);
});

it('does not recreate a contact point removed after a partial setup', async () => {
  const routing = mockInitialRouting();
  server.use(apiRoute('updateNotificationRoutingTree', { result: () => ({ status: 409 }) }));
  const { user } = await readyForm();
  await user.type(await screen.findByRole('textbox', { name: /Email addresses/ }), 'one@example.com');
  await submitForm(user);
  const dialog = await screen.findByRole('dialog');
  routing.contactPoints.pop();
  await user.click(within(dialog).getByRole('button', { name: 'Retry alerting setup' }));
  expect(await screen.findByText(/The Synthetic Monitoring contact point changed/)).toBeInTheDocument();
  expect(routing.creates).toHaveBeenCalledTimes(1);
  expect(routing.updates).not.toHaveBeenCalled();
});
