import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import { type UserEvent } from '@testing-library/user-event';
import { ALERT_TEST_ID } from 'test/dataTestIds';
import { LEGACY_GMA_ALERTING_RULES, LEGACY_GMA_HIGH_SENSITIVITY_RULE } from 'test/fixtures/alerting';
import { METRICS_DATASOURCE } from 'test/fixtures/datasources';
import { TENANT } from 'test/fixtures/tenants';
import { apiRoute, getServerRequests } from 'test/handlers';
import { getAlertRules, getGrafanaAlertRules } from 'test/handlers/alerting';
import { getTenant } from 'test/handlers/tenants';
import { render } from 'test/render';
import { server } from 'test/server';
import {
  runTestAsMetricsViewer,
  runTestAsSMViewer,
  runTestWithoutMetricsAccess,
  runTestWithoutPermissions,
  selectOption,
} from 'test/utils';

import { ApiEntry } from 'test/handlers/types';
import { AlertRecord } from 'types';
import { DEFAULT_RULES } from 'hooks/useAlerts';
import { ALERT_PROBE_SUCCESS_RECORDING_EXPR, ALERT_PROBE_SUCCESS_RECORDING_METRIC } from 'components/constants';
import { AlertingPage } from 'page/AlertingPage';

import {
  HIGH_SENSITIVITY_ALERT,
  LOOKUP_WARNING,
  serveGrafanaAlertRules,
  serveMigratedAlerts,
} from './__testHelpers__/alertingPage';

const CREATED_AFTER_LEGACY_ALERTS_CUTOFF = 1760572800;
const HIGH_SENSITIVITY_EXPR = `${ALERT_PROBE_SUCCESS_RECORDING_METRIC}{alert_sensitivity="high"} < 95`;
const ALERT_DESCRIPTION =
  'check job {{ $labels.job }} instance {{ $labels.instance }} has a success rate of {{ printf "%.1f" $value }}%.';

function holdResponse<T>(entry: ApiEntry<T>) {
  let release!: () => void;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });

  return {
    release,
    result: async (req: Request) => {
      await released;
      return entry.result(req);
    },
  };
}

const serveDatasourceAlertRules = (rules: AlertRecord[]) => {
  server.use(apiRoute('getAlertRules', { result: () => ({ json: { name: 'default', rules } }) }));
};

const openAlertRule = async (user: UserEvent, name = HIGH_SENSITIVITY_ALERT) => {
  await user.click(await screen.findByRole('button', { name }));
};

const findEnabledButton = async (name: string) => {
  const button = await screen.findByRole('button', { name });
  await waitFor(() => expect(button).toBeEnabled());
  return button;
};

const toggleSection = async (sectionName: string, user: UserEvent): Promise<HTMLElement> => {
  const sectionHeader = await screen.findByText(sectionName);
  await user.click(sectionHeader);
  return sectionHeader.parentElement?.parentElement ?? new HTMLElement();
};

describe('page access', () => {
  it('shows a spinner while the tenant, migrated alerts and datasource-managed alerts load', async () => {
    const tenant = holdResponse(getTenant);
    const migratedAlerts = holdResponse(getGrafanaAlertRules);
    const datasourceAlerts = holdResponse(getAlertRules);
    server.use(
      apiRoute('getTenant', { result: tenant.result }),
      apiRoute('getGrafanaAlertRules', { result: migratedAlerts.result }),
      apiRoute('getAlertRules', { result: datasourceAlerts.result })
    );
    render(<AlertingPage />);

    expect(await screen.findByTestId('Spinner')).toBeInTheDocument();
    expect(screen.queryByText('Legacy Alerting System')).not.toBeInTheDocument();

    tenant.release();
    expect(await screen.findByText('Legacy Alerting System')).toBeInTheDocument();
    expect(screen.getByTestId('Spinner')).toBeInTheDocument();
    expect(screen.queryByText(/View and edit default alerts/)).not.toBeInTheDocument();

    migratedAlerts.release();
    expect(await screen.findByText(/View and edit default alerts/)).toBeInTheDocument();
    expect(screen.getByTestId('Spinner')).toBeInTheDocument();

    datasourceAlerts.release();
    expect(await screen.findByRole('button', { name: HIGH_SENSITIVITY_ALERT })).toBeInTheDocument();
    expect(screen.queryByTestId('Spinner')).not.toBeInTheDocument();
  });

  it('shows the per-check alerts message to tenants created after legacy alerts were retired', async () => {
    server.use(
      apiRoute('getTenant', { result: () => ({ json: { ...TENANT, created: CREATED_AFTER_LEGACY_ALERTS_CUTOFF } }) })
    );
    render(<AlertingPage />);

    expect(await screen.findByText('Legacy Alerts Not Available')).toBeInTheDocument();
    expect(screen.queryByText('Legacy Alerting System')).not.toBeInTheDocument();
  });

  it.each([
    {
      reason: 'without permission to read alerts',
      setup: () => runTestWithoutPermissions('grafana-synthetic-monitoring-app.alerts:read'),
    },
    { reason: 'without a metrics data source', setup: runTestWithoutMetricsAccess },
  ])('asks users $reason to contact an admin', async ({ setup }) => {
    setup();
    render(<AlertingPage />);

    expect(await screen.findByText('Insufficient Permissions')).toBeInTheDocument();
    expect(screen.getByText('datasources:read')).toBeInTheDocument();
  });
});

describe('looking up migrated alerts', () => {
  it.each([403, 500] as const)(
    'falls back to the datasource-managed alerts when the lookup fails with a %s, until a retry finds them',
    async (status) => {
      server.use(apiRoute('getGrafanaAlertRules', { result: () => ({ status, json: { message: 'Lookup failed' } }) }));
      const { user } = render(<AlertingPage />);

      expect(await screen.findByText(LOOKUP_WARNING)).toBeInTheDocument();
      expect(await screen.findByRole('button', { name: HIGH_SENSITIVITY_ALERT })).toBeInTheDocument();

      serveGrafanaAlertRules(LEGACY_GMA_ALERTING_RULES);
      await user.click(screen.getByRole('button', { name: 'Retry' }));

      expect(await screen.findByRole('link', { name: `Edit ${HIGH_SENSITIVITY_ALERT}` })).toBeInTheDocument();
      expect(screen.queryByText(LOOKUP_WARNING)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: HIGH_SENSITIVITY_ALERT })).not.toBeInTheDocument();
    }
  );

  it('shows changes made in Alerting when the page is opened again', async () => {
    serveGrafanaAlertRules(LEGACY_GMA_ALERTING_RULES);
    const { rerender } = render(<AlertingPage />);
    expect(await screen.findByText(/less than 95% of probes/)).toBeInTheDocument();

    serveMigratedAlerts({
      ...LEGACY_GMA_HIGH_SENSITIVITY_RULE,
      query: `${ALERT_PROBE_SUCCESS_RECORDING_METRIC}{alert_sensitivity="high"} < 80`,
    });
    rerender(<AlertingPage key="reopened" />);

    expect(await screen.findByText(/less than 80% of probes/)).toBeInTheDocument();
  });

  it('keeps showing the migrated alerts when looking them up again fails', async () => {
    serveGrafanaAlertRules(LEGACY_GMA_ALERTING_RULES);
    const { queryClient, rerender } = render(<AlertingPage />);
    expect(await screen.findByText(HIGH_SENSITIVITY_ALERT)).toBeInTheDocument();

    server.use(
      apiRoute('getGrafanaAlertRules', { result: () => ({ status: 500, json: { message: 'Lookup failed' } }) })
    );
    rerender(<AlertingPage key="reopened" />);
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));

    expect(screen.getByRole('link', { name: `Edit ${HIGH_SENSITIVITY_ALERT}` })).toBeInTheDocument();
    expect(screen.queryByText(LOOKUP_WARNING)).not.toBeInTheDocument();
  });
});

describe('datasource-managed alerts', () => {
  it('lists the datasource-managed alerts and saves edits to them', async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute('updateAlertRules', {}, record));
    const { user } = render(<AlertingPage />);

    await openAlertRule(user);

    const alertNameInput = await screen.findByLabelText('Alert name');
    expect(alertNameInput).toHaveValue(HIGH_SENSITIVITY_ALERT);
    await user.clear(alertNameInput);
    await user.type(alertNameInput, 'A different name');

    const probePercentage = await screen.findByTestId(ALERT_TEST_ID.probePercentage);
    expect(probePercentage).toHaveValue(95);
    await user.clear(probePercentage);
    await user.type(probePercentage, '25');

    const timeCount = await screen.findByLabelText('Time count');
    expect(timeCount).toHaveValue(5);
    await user.clear(timeCount);
    await user.type(timeCount, '2');

    await selectOption(user, { dataTestId: ALERT_TEST_ID.timeUnitCombobox, option: 'seconds' });

    const labels = await toggleSection('Labels', user);
    await user.click(await within(labels).findByText('Add label'));
    const labelNameInputs = await within(labels).findAllByPlaceholderText('Name');
    await user.type(labelNameInputs[labelNameInputs.length - 1], 'a_label_name');
    const labelValueInputs = await within(labels).findAllByPlaceholderText('Value');
    await user.type(labelValueInputs[labelValueInputs.length - 1], 'a_label_value');

    const annotations = await toggleSection('Annotations', user);
    await user.click(await within(annotations).findByText('Add annotation'));
    const annotationNameInputs = await within(annotations).findAllByPlaceholderText('Name');
    await user.type(annotationNameInputs[annotationNameInputs.length - 1], 'an_annotation_name');
    const annotationValueInputs = await within(annotations).findAllByPlaceholderText('Value');
    annotationValueInputs[annotationValueInputs.length - 1].focus();
    await user.paste('an annotation value');

    await user.click(screen.getByText('Save alert'));
    await waitFor(() => expect(screen.queryByText('Save alert')).not.toBeInTheDocument());

    const { body } = await read();
    expect(body).toEqual({
      name: 'default',
      rules: [
        {
          record: 'instance_job_severity:probe_success:mean5m',
          expr: ALERT_PROBE_SUCCESS_RECORDING_EXPR,
        },
        {
          alert: 'A different name',
          expr: 'instance_job_severity:probe_success:mean5m{alert_sensitivity="high"} < 25',
          for: '2s',
          labels: {
            a_label_name: 'a_label_value',
            namespace: 'synthetic_monitoring',
          },
          annotations: {
            an_annotation_name: 'an annotation value',
            description: ALERT_DESCRIPTION,
            summary: 'check success below 95%',
          },
        },
        {
          alert: 'SyntheticMonitoringCheckFailureAtMediumSensitivity',
          expr: 'instance_job_severity:probe_success:mean5m{alert_sensitivity="medium"} < 90',
          for: '5m',
          labels: {
            namespace: 'synthetic_monitoring',
          },
          annotations: {
            description: ALERT_DESCRIPTION,
            summary: 'check success below 90%',
          },
        },
        {
          alert: 'SyntheticMonitoringCheckFailureAtLowSensitivity',
          expr: 'instance_job_severity:probe_success:mean5m{alert_sensitivity="low"} < 75',
          for: '5m',
          labels: {
            namespace: 'synthetic_monitoring',
          },
          annotations: {
            description: ALERT_DESCRIPTION,
            summary: 'check success below 75%',
          },
        },
      ],
    });
  });

  it('discards unsaved edits when cancelled', async () => {
    const { record, requests } = getServerRequests();
    server.use(apiRoute('updateAlertRules', {}, record));
    const { user } = render(<AlertingPage />);

    await openAlertRule(user);
    const alertNameInput = await screen.findByLabelText('Alert name');
    await user.clear(alertNameInput);
    await user.type(alertNameInput, 'A different name');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByLabelText('Alert name')).not.toBeInTheDocument();
    await openAlertRule(user);
    expect(await screen.findByLabelText('Alert name')).toHaveValue(HIGH_SENSITIVITY_ALERT);
    expect(requests).toHaveLength(0);
  });

  it('keeps the form open with an error when saving fails', async () => {
    server.use(
      apiRoute('updateAlertRules', { result: () => ({ status: 500, json: { message: 'Ruler is unavailable' } }) })
    );
    const { user } = render(<AlertingPage />);

    await openAlertRule(user);
    await user.click(await findEnabledButton('Save alert'));

    expect(await screen.findByText('There was an error updating the alert rule')).toBeInTheDocument();
    expect(screen.getByText('Ruler is unavailable')).toBeInTheDocument();
    expect(screen.getByLabelText('Alert name')).toBeInTheDocument();
  });

  it.each([
    { field: 'probe percentage', getInput: () => screen.getByTestId(ALERT_TEST_ID.probePercentage), value: '101' },
    { field: 'time count', getInput: () => screen.getByLabelText('Time count'), value: '1000' },
  ])('does not save a $field outside the allowed range', async ({ getInput, value }) => {
    const { record, requests } = getServerRequests();
    server.use(apiRoute('updateAlertRules', {}, record));
    const { user } = render(<AlertingPage />);

    await openAlertRule(user);
    await user.clear(getInput());
    await user.type(getInput(), value);
    await user.click(await findEnabledButton('Save alert'));

    await waitFor(() => expect(getInput()).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.getByRole('button', { name: 'Save alert' })).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it('edits an alert that has no labels or annotations', async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute('updateAlertRules', {}, record));
    serveDatasourceAlertRules([{ alert: HIGH_SENSITIVITY_ALERT, expr: HIGH_SENSITIVITY_EXPR, for: '5m' }]);
    const { user } = render(<AlertingPage />);

    await openAlertRule(user);
    await toggleSection('Config preview', user);

    expect(screen.getByText(`alert: ${HIGH_SENSITIVITY_ALERT}`)).toBeInTheDocument();
    expect(screen.queryByText('labels:')).not.toBeInTheDocument();
    expect(screen.queryByText('annotations:')).not.toBeInTheDocument();

    await user.click(await findEnabledButton('Save alert'));
    await waitFor(() => expect(screen.queryByText('Save alert')).not.toBeInTheDocument());

    const { body } = await read();
    expect(body).toEqual({
      name: 'default',
      rules: [{ alert: HIGH_SENSITIVITY_ALERT, expr: HIGH_SENSITIVITY_EXPR, for: '5m', labels: {}, annotations: {} }],
    });
  });

  it.each([
    { change: 'a custom expression', rule: { alert: 'CustomProbeAlert', expr: 'probe_success == 0', for: '5m' } },
    { change: 'no pending period', rule: { alert: 'CustomProbeAlert', expr: HIGH_SENSITIVITY_EXPR } },
    { change: 'a pending period in days', rule: { alert: 'CustomProbeAlert', expr: HIGH_SENSITIVITY_EXPR, for: '1d' } },
    {
      change: 'a zero threshold',
      rule: {
        alert: 'CustomProbeAlert',
        expr: `${ALERT_PROBE_SUCCESS_RECORDING_METRIC}{alert_sensitivity="high"} < 0`,
        for: '5m',
      },
    },
  ])('explains that an alert with $change can no longer be edited here', async ({ rule }) => {
    serveDatasourceAlertRules([rule]);
    const { user } = render(<AlertingPage />);

    await openAlertRule(user, 'CustomProbeAlert');

    expect(screen.getByText(/It looks like this rule has been edited in Cloud Alerting/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Grafana Cloud Alerting' })).toHaveAttribute(
      'href',
      `alerting/list?dataSource=${METRICS_DATASOURCE.name}`
    );
    expect(screen.queryByLabelText('Alert name')).not.toBeInTheDocument();
  });

  it('resets the alerts to their defaults after confirming', async () => {
    const { record, read, requests } = getServerRequests();
    server.use(apiRoute('updateAlertRules', {}, record));
    const { user } = render(<AlertingPage />);

    await user.click(await findEnabledButton('Reset to defaults'));
    await user.click(screen.getByRole('button', { name: 'Reset rules' }));

    expect(screen.queryByText('Reset default alert rules?')).not.toBeInTheDocument();
    await waitFor(() => expect(requests).toHaveLength(1));
    const { body } = await read();
    expect(body).toEqual(DEFAULT_RULES);
  });

  it.each(['Cancel', 'Close'])('leaves the alerts unchanged when the reset is dismissed with %s', async (button) => {
    const { record, requests } = getServerRequests();
    server.use(apiRoute('updateAlertRules', {}, record));
    const { user } = render(<AlertingPage />);

    await user.click(await findEnabledButton('Reset to defaults'));
    expect(screen.getByText('Reset default alert rules?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: button }));

    expect(screen.queryByText('Reset default alert rules?')).not.toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it.each([
    { json: { message: 'Ruler is unavailable' }, message: 'Ruler is unavailable' },
    { json: {}, message: 'We ran into a problem and could not fetch the alert rules' },
  ])('shows "$message" when the datasource-managed alerts cannot be fetched', async ({ json, message }) => {
    server.use(apiRoute('getAlertRules', { result: () => ({ status: 500, json }) }));
    render(<AlertingPage />);

    expect(await screen.findByText('Error fetching alert rules')).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.queryByText(/You do not have any legacy alerts/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset to defaults' })).not.toBeInTheDocument();
  });

  it('does not offer to create alerts when there are none', async () => {
    server.use(apiRoute('getAlertRules', { result: () => ({ status: 404, json: { message: 'Not found' } }) }));
    render(<AlertingPage />);

    expect(await screen.findByText(/You do not have any legacy alerts/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Populate default alerts' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset to defaults' })).not.toBeInTheDocument();
  });

  it('asks writers for data source access before they can change the alerts', async () => {
    runTestAsMetricsViewer();
    render(<AlertingPage />);

    expect(await screen.findByText('alert.instances.external:write')).toBeInTheDocument();
    expect(screen.getByText('Insufficient Permissions')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Reset to defaults' })).toBeDisabled();
  });

  it('shows the alerts read-only to viewers', async () => {
    runTestAsSMViewer();
    const { user } = render(<AlertingPage />);

    await openAlertRule(user);

    expect(await screen.findByLabelText('Alert name')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save alert' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reset to defaults' })).toBeDisabled();
    expect(screen.queryByText('Insufficient Permissions')).not.toBeInTheDocument();
  });
});
