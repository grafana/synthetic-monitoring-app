import React from 'react';
import { screen } from '@testing-library/react';
import {
  LEGACY_GMA_ALERTING_RULES,
  LEGACY_GMA_ALERTS_GROUP,
  LEGACY_GMA_HIGH_SENSITIVITY_RULE,
} from 'test/fixtures/alerting';
import { render } from 'test/render';
import { runTestWithoutGlobalPermissions } from 'test/utils';

import { ALERT_PROBE_SUCCESS_RECORDING_METRIC } from 'components/constants';
import { AlertingPage } from 'page/AlertingPage';

import { HIGH_SENSITIVITY_ALERT, serveGrafanaAlertRules, serveMigratedAlerts } from './__testHelpers__/alertingPage';

const highSensitivitySentence = (pendingPeriod: string) =>
  `Checks with a sensitivity level of high will fire an alert if less than 95% of probes report connection success for ${pendingPeriod}.`;

it('shows the migrated alerts read-only with links to edit them in Alerting', async () => {
  serveGrafanaAlertRules(LEGACY_GMA_ALERTING_RULES);
  render(<AlertingPage />);

  expect(await screen.findByText(HIGH_SENSITIVITY_ALERT)).toBeInTheDocument();
  expect(screen.getByText('SyntheticMonitoringCheckFailureAtMediumSensitivity')).toBeInTheDocument();
  expect(screen.getByText('SyntheticMonitoringCheckFailureAtLowSensitivity')).toBeInTheDocument();
  expect(screen.getByText(highSensitivitySentence('5 minutes'))).toBeInTheDocument();
  expect(screen.getAllByText('namespace=synthetic_monitoring')).toHaveLength(3);
  expect(screen.queryByText(/__grafana_origin/)).not.toBeInTheDocument();

  expect(screen.getByRole('link', { name: `Edit ${HIGH_SENSITIVITY_ALERT}` })).toHaveAttribute(
    'href',
    '/alerting/sm-legacy-high/edit'
  );
  expect(screen.getByRole('link', { name: `View ${HIGH_SENSITIVITY_ALERT}` })).toHaveAttribute(
    'href',
    '/alerting/grafana/sm-legacy-high/view'
  );
  expect(screen.getByRole('link', { name: 'Synthetic Monitoring legacy alerts > default' })).toHaveAttribute(
    'href',
    '/alerting/grafana/namespaces/sm-legacy-alerts/groups/default/view'
  );
});

it('ignores other Grafana-managed rules and the datasource-managed alerts', async () => {
  serveGrafanaAlertRules(LEGACY_GMA_ALERTING_RULES);
  render(<AlertingPage />);

  expect(await screen.findByText(HIGH_SENSITIVITY_ALERT)).toBeInTheDocument();
  expect(screen.queryByText('ProbeFailedExecutionsTooHigh [5m]')).not.toBeInTheDocument();
  expect(screen.queryByText('HighErrorRate')).not.toBeInTheDocument();
  expect(screen.queryByText(ALERT_PROBE_SUCCESS_RECORDING_METRIC)).not.toBeInTheDocument();
  expect(screen.queryByText(/View and edit default alerts/)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Reset to defaults' })).not.toBeInTheDocument();
});

it('only links to view the migrated alerts for users who cannot edit alert rules', async () => {
  runTestWithoutGlobalPermissions('alert.rules:write');
  serveGrafanaAlertRules(LEGACY_GMA_ALERTING_RULES);
  render(<AlertingPage />);

  expect(await screen.findByRole('link', { name: `View ${HIGH_SENSITIVITY_ALERT}` })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /^Edit / })).not.toBeInTheDocument();
});

it('does not link a migrated alert that has no uid', async () => {
  serveMigratedAlerts({ ...LEGACY_GMA_HIGH_SENSITIVITY_RULE, uid: undefined });
  render(<AlertingPage />);

  expect(await screen.findByText(HIGH_SENSITIVITY_ALERT)).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: `Edit ${HIGH_SENSITIVITY_ALERT}` })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: `View ${HIGH_SENSITIVITY_ALERT}` })).not.toBeInTheDocument();
});

it('leaves out tags when a migrated alert only has internal labels', async () => {
  serveMigratedAlerts({
    ...LEGACY_GMA_HIGH_SENSITIVITY_RULE,
    labels: { __grafana_origin: 'plugin/synthetic-monitoring-app-legacy' },
  });
  render(<AlertingPage />);

  expect(await screen.findByText(HIGH_SENSITIVITY_ALERT)).toBeInTheDocument();
  expect(screen.queryByRole('list', { name: 'Tags' })).not.toBeInTheDocument();
});

it.each([
  { duration: 5400, pendingPeriod: '1 hour 30 minutes' },
  { duration: undefined, pendingPeriod: '0 seconds' },
])('shows a pending period of $pendingPeriod in full', async ({ duration, pendingPeriod }) => {
  serveMigratedAlerts({ ...LEGACY_GMA_HIGH_SENSITIVITY_RULE, duration });
  render(<AlertingPage />);

  expect(await screen.findByText(highSensitivitySentence(pendingPeriod))).toBeInTheDocument();
});

it.each([
  {
    change: 'extra PromQL',
    query: `${ALERT_PROBE_SUCCESS_RECORDING_METRIC}{alert_sensitivity="high"} < 95 and on() hour() > 8`,
  },
  { change: 'another comparison', query: `${ALERT_PROBE_SUCCESS_RECORDING_METRIC}{alert_sensitivity="high"} <= 95` },
  {
    change: 'an unknown sensitivity',
    query: `${ALERT_PROBE_SUCCESS_RECORDING_METRIC}{alert_sensitivity="critical"} < 95`,
  },
])('shows the expression of a migrated alert changed in Alerting to use $change', async ({ query }) => {
  serveMigratedAlerts({ ...LEGACY_GMA_HIGH_SENSITIVITY_RULE, query });
  render(<AlertingPage />);

  expect(await screen.findByText(query)).toBeInTheDocument();
  expect(screen.queryByText(/Checks with a sensitivity level/)).not.toBeInTheDocument();
});

it('links each group the migrated alerts are in', async () => {
  serveGrafanaAlertRules({
    data: {
      groups: [
        { ...LEGACY_GMA_ALERTS_GROUP, rules: [LEGACY_GMA_HIGH_SENSITIVITY_RULE] },
        {
          ...LEGACY_GMA_ALERTS_GROUP,
          name: 'On call',
          file: 'SRE alerts',
          folderUid: 'sre-alerts',
          rules: [{ ...LEGACY_GMA_HIGH_SENSITIVITY_RULE, name: 'PagingAlert', uid: 'sre-paging' }],
        },
      ],
    },
    status: 'success',
  });
  render(<AlertingPage />);

  expect(await screen.findByRole('link', { name: 'Synthetic Monitoring legacy alerts > default' })).toHaveAttribute(
    'href',
    '/alerting/grafana/namespaces/sm-legacy-alerts/groups/default/view'
  );
  expect(screen.getByRole('link', { name: 'SRE alerts > On call' })).toHaveAttribute(
    'href',
    '/alerting/grafana/namespaces/sre-alerts/groups/On%20call/view'
  );
  expect(screen.getByRole('link', { name: 'Edit PagingAlert' })).toHaveAttribute('href', '/alerting/sre-paging/edit');
});
