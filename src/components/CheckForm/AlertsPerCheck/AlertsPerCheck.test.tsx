import { screen, waitFor, within } from '@testing-library/react';
import { cloneDeep } from 'lodash';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';
import { notificationContactPointFactory } from 'test/factories/notificationContactPoint';
import { BASIC_CHECK_ALERTS } from 'test/fixtures/checkAlerts';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import {
  DEFAULT_NOTIFICATION_CONTACT_POINT,
  DEFAULT_NOTIFICATION_TREE,
  EMPTY_NOTIFICATION_CONTACT_POINT,
  EMPTY_NOTIFICATION_TREE,
  MULTI_DESTINATION_NOTIFICATION_TREE,
  PLACEHOLDER_NOTIFICATION_CONTACT_POINT,
  SECOND_NOTIFICATION_CONTACT_POINT,
  UNCONFIGURED_NOTIFICATION_CONTACT_POINT,
} from 'test/fixtures/notificationRouting';
import { TENANT } from 'test/fixtures/tenants';
import { apiRoute, getServerRequests } from 'test/handlers';
import { server } from 'test/server';
import { runTestAsNotificationSetupWriter, runTestAsRBACEditor, testUsesCombobox } from 'test/utils';

import { CheckAlertType, CheckType, HttpMethod, IpVersion } from 'types';
import { gotoSection, openAlertRunbook } from 'components/Checkster/__testHelpers__/formHelpers';
import { FormSectionName } from 'components/Checkster/types';
import { renderEditForm, renderNewForm } from 'page/__testHelpers__/checkForm';
import { fillMandatoryFields } from 'page/__testHelpers__/v2.utils';

const failureFields = CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.ProbeFailedExecutionsTooHigh];

describe('alert and notification summary', () => {
  beforeEach(() => {
    const alerts = BASIC_CHECK_ALERTS.alerts.slice(0, 3).map((alert) => ({ ...alert, threshold: 1, period: '5m' }));
    server.use(
      apiRoute('listChecks', {
        result: () => ({
          json: [
            {
              ...BASIC_HTTP_CHECK,
              frequency: 60000,
              timeout: 10000,
              settings: { http: { method: HttpMethod.Get, ipVersion: IpVersion.V4, noFollowRedirects: false } },
              alerts,
            },
          ],
        }),
      }),
      apiRoute('listAlertsForCheck', { result: () => ({ json: { alerts } }) })
    );
  });

  it('loads routing on the first step and waits to reveal the setup panel and alert cards together', async () => {
    runTestAsNotificationSetupWriter();
    let finishLoading!: () => void;
    const pending = new Promise<void>((resolve) => {
      finishLoading = resolve;
    });
    const routingReads = jest.fn();
    const contactReads = jest.fn();
    server.use(
      apiRoute('listNotificationRoutingTrees', {}, routingReads),
      apiRoute(
        'listNotificationContactPoints',
        {
          result: async () => {
            await pending;
            return { json: { items: [UNCONFIGURED_NOTIFICATION_CONTACT_POINT], metadata: {} } };
          },
        },
        contactReads
      )
    );
    try {
      const { user } = await renderNewForm(CheckType.Http);
      await waitFor(() => expect(routingReads).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(contactReads).toHaveBeenCalledTimes(1));
      expect(screen.getByRole('tabpanel', { name: '1 Request' })).toBeInTheDocument();
      await gotoSection(user, FormSectionName.Alerting);
      expect(await screen.findByRole('status', { name: 'Loading alerting setup' })).toBeInTheDocument();
      expect(screen.queryByRole('checkbox', { name: 'Failed Checks' })).not.toBeInTheDocument();
      expect(screen.queryByRole('textbox', { name: /Email addresses/ })).not.toBeInTheDocument();
      finishLoading();
      expect(await screen.findByRole('textbox', { name: /Email addresses/ })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Failed Checks' })).toBeChecked();
      expect(screen.queryByRole('status', { name: 'Loading alerting setup' })).not.toBeInTheDocument();
      expect(routingReads).toHaveBeenCalledTimes(1);
      expect(contactReads).toHaveBeenCalledTimes(1);
    } finally {
      finishLoading();
    }
  });

  it('enables failed checks by default with inline controls and an explicit opt-out', async () => {
    const { user } = await renderNewForm(CheckType.Http);
    await gotoSection(user, FormSectionName.Alerting);
    const failureAlert = await screen.findByRole('group', { name: 'Failed Checks' });
    const checkbox = within(failureAlert).getByRole('checkbox', { name: 'Failed Checks' });
    expect(checkbox).toBeChecked();
    expect(within(failureAlert).getByRole('button', { name: 'Add runbook for Failed Checks' })).toBeInTheDocument();
    expect(within(failureAlert).getByRole('spinbutton', { name: 'Failed Checks threshold' })).toBeEnabled();
    expect(within(failureAlert).queryByTestId(failureFields.runbookUrlInput)).not.toBeInTheDocument();
    expect(within(failureAlert).getByRole('spinbutton', { name: 'Failed Checks threshold' })).toBeEnabled();
    expect(
      await within(failureAlert).findByRole('button', { name: 'Show routing for Failed Checks' })
    ).toBeInTheDocument();
    expect(within(failureAlert).queryByTestId(failureFields.runbookUrlInput)).not.toBeInTheDocument();
    expect(screen.queryByText(/^On$|^Off$/)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Notifications' })).not.toBeInTheDocument();
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(within(failureAlert).queryByText('Notify')).not.toBeInTheDocument();
    expect(within(failureAlert).getByRole('spinbutton', { name: 'Failed Checks threshold' })).toBeDisabled();
  });

  it('keeps the runbook separate from routing details for the alert', async () => {
    const { user } = await renderNewForm(CheckType.Http);
    await gotoSection(user, FormSectionName.Alerting);
    await openAlertRunbook(user, 'Failed Checks');
    const details = screen.getByRole('region', { name: 'Failed Checks runbook' });
    expect(within(details).getByRole('textbox', { name: /^Runbook URL \(optional\)/ })).toBeEnabled();
    expect(within(details).getByRole('textbox', { name: /^Runbook URL \(optional\)/ })).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Add runbook for Failed Checks' })).not.toBeInTheDocument();
    expect(within(details).getByRole('button', { name: 'Remove runbook' })).toBeInTheDocument();
    expect(
      within(details).getByText('Link to instructions for investigating and resolving this alert.')
    ).toBeInTheDocument();
    expect(within(details).queryByText('Routes through')).not.toBeInTheDocument();
    const failureAlert = screen.getByRole('group', { name: 'Failed Checks' });
    await user.click(await within(failureAlert).findByRole('button', { name: 'Show routing for Failed Checks' }));
    const contactPoint = within(failureAlert).getByRole('region', {
      name: 'Failed Checks notification routing',
    });
    expect(await within(contactPoint).findByRole('link', { name: 'Default policy' })).toHaveAttribute(
      'href',
      '/alerting/routes/policy/user-defined/edit?alertmanager=grafana'
    );
    expect(within(failureAlert).getByRole('link', { name: 'grafana-default-email' })).toHaveAttribute(
      'href',
      '/alerting/notifications/receivers/Z3JhZmFuYS1kZWZhdWx0LWVtYWls/edit'
    );
    expect(within(contactPoint).queryByRole('list', { name: 'Alert labels' })).not.toBeInTheDocument();
    expect(within(contactPoint).queryByLabelText('job: Not set')).not.toBeInTheDocument();
    expect(within(contactPoint).queryByLabelText('instance: Not set')).not.toBeInTheDocument();
    const routingExplanation = within(contactPoint).getByText(
      'Notification policies determine which contact points receive this alert based on its labels.'
    );
    expect(routingExplanation).toBeInTheDocument();
    const showLabels = within(contactPoint).getByRole('button', { name: 'See labels' });
    expect(showLabels).toHaveAttribute('aria-expanded', 'false');
    await user.click(showLabels);
    expect(within(contactPoint).getByRole('button', { name: 'Hide labels' })).toHaveAttribute('aria-expanded', 'true');
    const alertLabels = within(contactPoint).getByRole('list', { name: 'Alert labels' });
    expect(within(alertLabels).getByLabelText('alertname: ProbeFailedExecutionsTooHigh [5m]')).toBeInTheDocument();
    expect(within(alertLabels).getByLabelText('namespace: synthetic_monitoring')).toBeInTheDocument();
    expect(within(alertLabels).getByLabelText('grafana_folder: Grafana Synthetic Monitoring')).toBeInTheDocument();
    expect(within(alertLabels).getByLabelText('job: Not set')).toHaveTextContent('job = Not set');
    expect(within(alertLabels).getByLabelText('instance: Not set')).toHaveTextContent('instance = Not set');
    expect(within(failureAlert).getAllByText('grafana-default-email')).toHaveLength(1);
    expect(within(failureAlert).queryByRole('button', { name: 'grafana-default-email' })).not.toBeInTheDocument();
    expect(within(contactPoint).getByText('Routes through')).toBeInTheDocument();
    expect(routingExplanation).toBeInTheDocument();
    expect(within(contactPoint).queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByText('Matching notification policies')).not.toBeInTheDocument();
    expect(within(details).queryByTestId(failureFields.thresholdInput)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add runbook for TLS Certificate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add runbook for Latency' })).toBeInTheDocument();
    await user.click(within(details).getByRole('button', { name: 'Remove runbook' }));
    expect(screen.queryByRole('region', { name: 'Failed Checks runbook' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add runbook for Failed Checks' })).toHaveFocus();
    expect(contactPoint).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Failed Checks threshold' })).toBeEnabled();
    await user.click(within(contactPoint).getByRole('button', { name: 'Hide labels' }));
    expect(within(contactPoint).queryByRole('list', { name: 'Alert labels' })).not.toBeInTheDocument();
    expect(within(contactPoint).queryByLabelText('job: Not set')).not.toBeInTheDocument();
    expect(within(contactPoint).queryByLabelText('instance: Not set')).not.toBeInTheDocument();
    expect(routingExplanation).toBeInTheDocument();
    expect(within(contactPoint).getByRole('button', { name: 'See labels' })).toHaveAttribute('aria-expanded', 'false');
    expect(within(contactPoint).getByRole('link', { name: 'Default policy' })).toBeInTheDocument();
    const hideRouting = within(failureAlert).getByRole('button', { name: 'Hide routing for Failed Checks' });
    expect(hideRouting).toHaveTextContent('Hide routing');
    await user.click(hideRouting);
    expect(within(failureAlert).queryByRole('list', { name: 'Alert labels' })).not.toBeInTheDocument();
    expect(within(failureAlert).getByRole('button', { name: 'Show routing for Failed Checks' })).toHaveTextContent(
      'Show routing'
    );
  });

  it('keeps both alerting tabs and access to legacy sensitivity for eligible tenants', async () => {
    server.use(apiRoute('getTenant', { result: () => ({ json: { ...TENANT, created: 1760400000 } }) }));
    const { user } = await renderNewForm(CheckType.Http);
    await gotoSection(user, FormSectionName.Alerting);
    expect(await screen.findByRole('tab', { name: 'Per-check alerts' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Legacy alerts' }));
    expect(await screen.findByText('Select alert sensitivity')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Per-check alerts' }));
    expect(await screen.findByRole('checkbox', { name: 'Failed Checks' })).toBeInTheDocument();
  });

  it('renders the alert form without a lone tab when legacy alerts are unavailable', async () => {
    server.use(apiRoute('getTenant', { result: () => ({ json: { ...TENANT, created: 1760572800 } }) }));
    const { user } = await renderNewForm(CheckType.Http);
    await gotoSection(user, FormSectionName.Alerting);
    expect(await screen.findByRole('checkbox', { name: 'Failed Checks' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Per-check alerts' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Legacy alerts' })).not.toBeInTheDocument();
  });

  it('shows existing runbooks and preserves edited settings when toggling alerts', async () => {
    const { user } = await renderEditForm(BASIC_HTTP_CHECK.id);
    await gotoSection(user, FormSectionName.Alerting);
    expect(await screen.findByTestId(failureFields.selectedCheckbox)).toBeChecked();
    expect(screen.queryByRole('button', { name: 'Add runbook for Failed Checks' })).not.toBeInTheDocument();
    const runbook = screen.getByTestId(failureFields.runbookUrlInput);
    expect(runbook).toHaveValue('https://example.com/runbooks/probe-failures');
    await user.clear(runbook);
    await user.type(runbook, 'https://example.com/updated');
    await user.click(screen.getByTestId(failureFields.selectedCheckbox));
    expect(screen.getByTestId(failureFields.selectedCheckbox)).not.toBeChecked();
    expect(runbook).toBeDisabled();
    const details = screen.getByRole('region', { name: 'Failed Checks runbook' });
    expect(within(details).getByRole('button', { name: 'Remove runbook' })).toBeDisabled();
    await user.click(screen.getByTestId(failureFields.selectedCheckbox));
    expect(runbook).toBeEnabled();
    expect(screen.getByTestId(failureFields.runbookUrlInput)).toHaveValue('https://example.com/updated');
  });

  it('removes a saved runbook without affecting other alerts and submits the removal', async () => {
    const { record, read, requests } = getServerRequests();
    server.use(apiRoute('updateAlertsForCheck', {}, record));
    const { user } = await renderEditForm(BASIC_HTTP_CHECK.id);
    await gotoSection(user, FormSectionName.Alerting);
    const details = await screen.findByRole('region', { name: 'Failed Checks runbook' });
    expect(screen.getByTestId(failureFields.runbookUrlInput)).toHaveValue(
      'https://example.com/runbooks/probe-failures'
    );
    await user.click(within(details).getByRole('button', { name: 'Remove runbook' }));
    expect(screen.queryByTestId(failureFields.runbookUrlInput)).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('https://example.com/runbooks/tls-certificate')).toBeInTheDocument();
    await openAlertRunbook(user, 'Failed Checks');
    expect(screen.getByTestId(failureFields.runbookUrlInput)).toHaveValue('');
    await user.click(screen.getByTestId(CHECKSTER_TEST_ID.form.submitButton));
    await waitFor(() => expect(requests).toHaveLength(1));
    const { body } = await read();
    expect(body.alerts).toEqual(
      expect.arrayContaining([
        { name: CheckAlertType.ProbeFailedExecutionsTooHigh, period: '5m', threshold: 1 },
        expect.objectContaining({
          name: CheckAlertType.TLSTargetCertificateCloseToExpiring,
          runbookUrl: 'https://example.com/runbooks/tls-certificate',
        }),
      ])
    );
  });

  it.each([
    [EMPTY_NOTIFICATION_TREE, EMPTY_NOTIFICATION_CONTACT_POINT],
    [DEFAULT_NOTIFICATION_TREE, PLACEHOLDER_NOTIFICATION_CONTACT_POINT],
    [DEFAULT_NOTIFICATION_TREE, UNCONFIGURED_NOTIFICATION_CONTACT_POINT],
  ])('offers notification setup instead of routing for an unconfigured default', async (tree, contactPoint) => {
    runTestAsNotificationSetupWriter();
    server.use(
      apiRoute('listNotificationRoutingTrees', {
        result: () => ({ json: { items: [tree], metadata: {} } }),
      }),
      apiRoute('listNotificationContactPoints', {
        result: () => ({ json: { items: [contactPoint], metadata: {} } }),
      })
    );
    const { user } = await renderNewForm(CheckType.Http);
    await gotoSection(user, FormSectionName.Alerting);
    const failureAlert = await screen.findByRole('group', { name: 'Failed Checks' });
    expect(await within(failureAlert).findByText('No notification destination configured')).toBeInTheDocument();
    expect(within(failureAlert).queryByRole('button', { name: /Show routing/ })).not.toBeInTheDocument();
    expect(within(failureAlert).queryByText('Notify')).not.toBeInTheDocument();
    await user.click(within(failureAlert).getByRole('button', { name: 'Set up notifications' }));
    const emails = screen.getByRole('textbox', { name: /Email addresses/ });
    expect(emails).toHaveFocus();
    await user.type(emails, 'oncall@example.com');
    expect(within(failureAlert).getByText('Notify')).toBeInTheDocument();
    expect(within(failureAlert).getByText('oncall@example.com')).toBeInTheDocument();
    expect(within(failureAlert).queryByText('No notification destination configured')).not.toBeInTheDocument();
  });

  it('links to Grafana Alerting when the user cannot configure notifications inline', async () => {
    runTestAsRBACEditor();
    server.use(
      apiRoute('listNotificationContactPoints', {
        result: () => ({ json: { items: [UNCONFIGURED_NOTIFICATION_CONTACT_POINT], metadata: {} } }),
      })
    );
    const { user } = await renderEditForm(BASIC_HTTP_CHECK.id);
    await gotoSection(user, FormSectionName.Alerting);
    const failureAlert = await screen.findByRole('group', { name: 'Failed Checks' });
    expect(await within(failureAlert).findByText('No notification destination configured')).toBeInTheDocument();
    expect(within(failureAlert).getByRole('link', { name: 'Set up notifications' })).toHaveAttribute(
      'href',
      '/alerting/notifications'
    );
    expect(within(failureAlert).queryByRole('button', { name: /Show routing/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /Email addresses/ })).not.toBeInTheDocument();
  });

  it.each(['empty', undefined])('keeps routing details for a custom policy with receiver %s', async (receiver) => {
    server.use(
      apiRoute('listNotificationContactPoints', {
        result: () => ({ json: { items: [EMPTY_NOTIFICATION_CONTACT_POINT], metadata: {} } }),
      }),
      apiRoute('listNotificationRoutingTrees', {
        result: () => ({
          json: {
            items: [
              {
                ...EMPTY_NOTIFICATION_TREE,
                spec: {
                  ...EMPTY_NOTIFICATION_TREE.spec,
                  routes: [
                    {
                      matchers: [{ label: 'namespace', type: '=', value: 'synthetic_monitoring' }],
                      receiver,
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
    const { user } = await renderNewForm(CheckType.Http);
    await gotoSection(user, FormSectionName.Alerting);
    const failureAlert = await screen.findByRole('group', { name: 'Failed Checks' });
    expect(await within(failureAlert).findByText('Not configured')).toBeInTheDocument();
    await user.click(within(failureAlert).getByRole('button', { name: 'Show routing for Failed Checks' }));
    const details = within(failureAlert).getByRole('region', { name: 'Failed Checks notification routing' });
    expect(within(details).getByRole('link', { name: 'namespace=synthetic_monitoring' })).toHaveAttribute(
      'href',
      '/alerting/routes/policy/user-defined/edit?alertmanager=grafana'
    );
    expect(within(failureAlert).queryByText('No notification destination configured')).not.toBeInTheDocument();
  });

  it('clears runbook validation errors when removed and allows saving without a URL', async () => {
    const { user, read } = await renderNewForm(CheckType.Http);
    await fillMandatoryFields({ user, checkType: CheckType.Http });
    await gotoSection(user, FormSectionName.Alerting);
    await openAlertRunbook(user, 'Failed Checks');
    await user.type(screen.getByTestId(failureFields.runbookUrlInput), 'not-a-url');
    await user.click(screen.getByTestId(CHECKSTER_TEST_ID.form.submitButton));
    expect(await screen.findByText('Runbook URL must be a valid URL')).toBeInTheDocument();
    const details = screen.getByRole('region', { name: 'Failed Checks runbook' });
    await user.click(within(details).getByRole('button', { name: 'Remove runbook' }));
    expect(screen.queryByText('Runbook URL must be a valid URL')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Failed Checks runbook' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add runbook for Failed Checks' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Add runbook for TLS Certificate' })).toBeInTheDocument();
    await user.click(screen.getByTestId(CHECKSTER_TEST_ID.form.submitButton));
    expect((await read(1)).body).toEqual({
      alerts: [{ name: CheckAlertType.ProbeFailedExecutionsTooHigh, period: '5m', threshold: 1 }],
    });
  });

  it.each(['listNotificationRoutingTrees', 'listNotificationContactPoints'] as const)(
    'shows unknown instead of successful routing when %s is forbidden',
    async (endpoint) => {
      server.use(apiRoute(endpoint, { result: () => ({ status: 403 }) }));
      const { user } = await renderEditForm(BASIC_HTTP_CHECK.id);
      await gotoSection(user, FormSectionName.Alerting);
      expect(
        await within(screen.getByRole('group', { name: 'Failed Checks' })).findByText(
          /Notification routing could not be verified/
        )
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Show routing for Failed Checks' })).not.toBeInTheDocument();
      expect(screen.queryByText(/Notification setup is incomplete/)).not.toBeInTheDocument();
    }
  );

  it('keeps destinations with their alert and updates the preview when the period changes', async () => {
    testUsesCombobox();
    const failureContact = notificationContactPointFactory.build({ spec: { title: 'Failed checks team' } });
    server.use(
      apiRoute('listNotificationContactPoints', {
        result: () => ({ json: { items: [DEFAULT_NOTIFICATION_CONTACT_POINT, failureContact], metadata: {} } }),
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
                      matchers: [{ label: 'alertname', type: '=', value: 'ProbeFailedExecutionsTooHigh [5m]' }],
                      receiver: 'Failed checks team',
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
    const { user } = await renderEditForm(BASIC_HTTP_CHECK.id);
    await gotoSection(user, FormSectionName.Alerting);
    const failureAlert = await screen.findByRole('group', { name: 'Failed Checks' });
    const tlsAlert = screen.getByRole('group', { name: 'TLS Certificate' });
    expect(
      await within(failureAlert).findByRole('button', { name: 'Show routing for Failed Checks' })
    ).toBeInTheDocument();
    expect(within(tlsAlert).getByRole('button', { name: 'Show routing for TLS Certificate' })).toBeInTheDocument();
    expect(within(tlsAlert).queryByRole('link', { name: 'Failed checks team' })).not.toBeInTheDocument();
    await user.click(within(failureAlert).getByRole('button', { name: 'Show routing for Failed Checks' }));
    const details = within(failureAlert).getByRole('region', { name: 'Failed Checks notification routing' });
    expect(
      await within(details).findByRole('link', {
        name: 'alertname=ProbeFailedExecutionsTooHigh [5m]',
      })
    ).toHaveAttribute('href', '/alerting/routes/policy/user-defined/edit?alertmanager=grafana');
    await user.click(within(details).getByRole('button', { name: 'See labels' }));
    const alertLabels = within(details).getByRole('list', { name: 'Alert labels' });
    expect(within(alertLabels).getByLabelText('alertname: ProbeFailedExecutionsTooHigh [5m]')).toHaveTextContent(
      'alertname = ProbeFailedExecutionsTooHigh [5m]'
    );
    await user.click(within(failureAlert).getByRole('combobox', { name: 'Failed Checks period' }));
    await user.click(screen.getByRole('option', { name: '10 min' }));
    expect(await within(failureAlert).findByRole('link', { name: 'grafana-default-email' })).toBeInTheDocument();
    expect(within(failureAlert).queryByRole('link', { name: 'Failed checks team' })).not.toBeInTheDocument();
    expect(within(failureAlert).getByRole('button', { name: 'Hide routing for Failed Checks' })).toBeInTheDocument();
    const updatedLabels = within(failureAlert).getByRole('list', { name: 'Alert labels' });
    expect(within(updatedLabels).getByLabelText('alertname: ProbeFailedExecutionsTooHigh [10m]')).toBeInTheDocument();
    expect(
      within(updatedLabels).queryByLabelText('alertname: ProbeFailedExecutionsTooHigh [5m]')
    ).not.toBeInTheDocument();
  });

  it('reads subsequent contact point pages before classifying a destination', async () => {
    const { record, read } = getServerRequests();
    server.use(
      apiRoute(
        'listNotificationContactPoints',
        {
          result: (request) => ({
            json: new URL(request.url).searchParams.get('continue')
              ? { items: [DEFAULT_NOTIFICATION_CONTACT_POINT], metadata: {} }
              : { items: [], metadata: { continue: 'page-2' } },
          }),
        },
        record
      )
    );
    const { user } = await renderNewForm(CheckType.Http);
    await gotoSection(user, FormSectionName.Alerting);
    expect(await screen.findByRole('button', { name: 'Show routing for Failed Checks' })).toBeInTheDocument();
    const { request } = await read(1);
    expect(new URL(request.url).searchParams.get('continue')).toBe('page-2');
    expect(screen.queryByText(/Notification routing could not be verified/)).not.toBeInTheDocument();
  });

  it.each(['different', 'same'] as const)(
    'shows both matching branches together when they lead to %s contact points',
    async (destinations) => {
      const tree = cloneDeep(MULTI_DESTINATION_NOTIFICATION_TREE);
      if (destinations === 'same') {
        tree.spec.routes[0].routes![1].receiver = 'grafana-default-email';
      }
      server.use(
        apiRoute('listNotificationRoutingTrees', { result: () => ({ json: { items: [tree], metadata: {} } }) }),
        apiRoute('listNotificationContactPoints', {
          result: () => ({
            json: { items: [DEFAULT_NOTIFICATION_CONTACT_POINT, SECOND_NOTIFICATION_CONTACT_POINT], metadata: {} },
          }),
        })
      );
      const { user } = await renderNewForm(CheckType.Http);
      await gotoSection(user, FormSectionName.Alerting);
      const alert = await screen.findByRole('group', { name: 'Failed Checks' });
      expect(within(alert).getAllByRole('button', { name: /Show routing/ })).toHaveLength(1);
      expect(within(alert).getAllByRole('link', { name: 'grafana-default-email' })).toHaveLength(1);
      if (destinations === 'different') {
        expect(within(alert).getByRole('link', { name: 'SM second team' })).toBeInTheDocument();
      }
      await user.click(within(alert).getByRole('button', { name: 'Show routing for Failed Checks' }));
      const details = within(alert).getByRole('region', { name: 'Failed Checks notification routing' });
      const policies = within(details).getByRole('list', { name: 'Matched notification policies' });
      expect(within(policies).getAllByRole('link', { name: 'Default policy' })).toHaveLength(1);
      expect(within(policies).getAllByRole('link', { name: 'namespace=synthetic_monitoring' })).toHaveLength(1);
      expect(within(policies).getAllByRole('link', { name: 'check_name=http' })).toHaveLength(2);
      expect(within(policies).getAllByText('Routes to')).toHaveLength(2);
      expect(within(policies).getAllByRole('link', { name: 'grafana-default-email' })).toHaveLength(
        destinations === 'same' ? 2 : 1
      );
      if (destinations === 'different') {
        expect(within(policies).getByRole('link', { name: 'SM second team' })).toBeInTheDocument();
      }
      await user.click(within(details).getByRole('button', { name: 'See labels' }));
      expect(within(details).getAllByRole('list', { name: 'Alert labels' })).toHaveLength(1);
      const labels = within(details).getByRole('list', { name: 'Alert labels' });
      expect(within(labels).getByLabelText('check_name: http')).toHaveTextContent('check_name = http');
      expect(within(labels).getByLabelText('namespace: synthetic_monitoring')).toHaveTextContent(
        'namespace = synthetic_monitoring'
      );
      expect(within(labels).queryByTitle('Used by a matching policy')).not.toBeInTheDocument();
      await user.click(within(alert).getByRole('button', { name: 'Hide routing for Failed Checks' }));
      expect(within(alert).queryByRole('region')).not.toBeInTheDocument();
      expect(within(alert).getAllByRole('link', { name: 'grafana-default-email' })).toHaveLength(1);
    }
  );

  it('shows only the first destination when its policy stops matching siblings', async () => {
    const tree = cloneDeep(MULTI_DESTINATION_NOTIFICATION_TREE);
    tree.spec.routes[0].routes![0].continue = false;
    server.use(
      apiRoute('listNotificationRoutingTrees', { result: () => ({ json: { items: [tree], metadata: {} } }) }),
      apiRoute('listNotificationContactPoints', {
        result: () => ({
          json: { items: [DEFAULT_NOTIFICATION_CONTACT_POINT, SECOND_NOTIFICATION_CONTACT_POINT], metadata: {} },
        }),
      })
    );
    const { user } = await renderNewForm(CheckType.Http);
    await gotoSection(user, FormSectionName.Alerting);
    const alert = await screen.findByRole('group', { name: 'Failed Checks' });
    expect(within(alert).getByRole('link', { name: 'grafana-default-email' })).toBeInTheDocument();
    await user.click(within(alert).getByRole('button', { name: 'Show routing for Failed Checks' }));
    expect(within(alert).getByText(/^Routes through/)).toBeInTheDocument();
    expect(within(alert).getByRole('link', { name: 'check_name=http' })).toBeInTheDocument();
    expect(within(alert).queryByRole('link', { name: 'SM second team' })).not.toBeInTheDocument();
    expect(within(alert).queryByRole('list', { name: 'Matched notification policies' })).not.toBeInTheDocument();
  });

  it('identifies the unconfigured contact point without implying all destinations are broken', async () => {
    server.use(
      apiRoute('listNotificationRoutingTrees', {
        result: () => ({ json: { items: [MULTI_DESTINATION_NOTIFICATION_TREE], metadata: {} } }),
      }),
      apiRoute('listNotificationContactPoints', {
        result: () => ({
          json: { items: [UNCONFIGURED_NOTIFICATION_CONTACT_POINT, SECOND_NOTIFICATION_CONTACT_POINT], metadata: {} },
        }),
      })
    );
    const { user } = await renderNewForm(CheckType.Http);
    await gotoSection(user, FormSectionName.Alerting);
    const alert = await screen.findByRole('group', { name: 'Failed Checks' });
    expect(within(alert).getByText('Not configured')).toBeInTheDocument();
    expect(
      within(alert).getByText(
        'Some contact points are not configured. Notifications may not reach all intended recipients.'
      )
    ).toBeInTheDocument();
    expect(within(alert).queryByText(/without notifying anyone/)).not.toBeInTheDocument();
    await user.click(within(alert).getByRole('button', { name: 'Show routing for Failed Checks' }));
    const policies = within(alert).getByRole('list', { name: 'Matched notification policies' });
    expect(within(policies).getByRole('link', { name: 'grafana-default-email' })).toBeInTheDocument();
    expect(within(policies).getByRole('link', { name: 'SM second team' })).toBeInTheDocument();
  });

  it('does not claim default delivery if the default tree is absent', async () => {
    server.use(
      apiRoute('listNotificationRoutingTrees', {
        result: () => ({
          json: {
            items: [{ ...DEFAULT_NOTIFICATION_TREE, metadata: { name: 'another-tree' } }],
            metadata: {},
          },
        }),
      })
    );
    const { user } = await renderEditForm(BASIC_HTTP_CHECK.id);
    await gotoSection(user, FormSectionName.Alerting);
    expect(
      await within(screen.getByRole('group', { name: 'Failed Checks' })).findByText(
        /Notification routing could not be verified/
      )
    ).toBeInTheDocument();
  });
});
