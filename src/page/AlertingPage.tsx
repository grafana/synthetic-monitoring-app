import React, { useContext, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { Alert, Button, Icon, Modal, Spinner, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { AlertFormValues, AlertRule } from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import { useAlerts } from 'hooks/useAlerts';
import useUnifiedAlertsEnabled from 'hooks/useUnifiedAlertsEnabled';
import { transformAlertFormValues } from 'components/alertingTransformations';
import { AlertRuleForm } from 'components/AlertRuleForm';
import { PluginPage } from 'components/PluginPage';

type SplitAlertRules = {
  recordingRules: AlertRule[];
  alertingRules: AlertRule[];
};

export const AlertingPage = () => {
  return (
    <PluginPage>
      <Alerting />
    </PluginPage>
  );
};

const Alerting = () => {
  const styles = useStyles2(getStyles);
  const { alertRules, setDefaultRules, setRules, alertError } = useAlerts();
  const [updatingDefaultRules, setUpdatingDefaultRules] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const { instance } = useContext(InstanceContext);
  const isUnifiedAlertingEnabled = useUnifiedAlertsEnabled();

  const { recordingRules, alertingRules } = alertRules?.reduce<SplitAlertRules>(
    (rules, currentRule) => {
      if (currentRule.record) {
        rules.recordingRules.push(currentRule);
      } else {
        rules.alertingRules.push(currentRule);
      }
      return rules;
    },
    { recordingRules: [], alertingRules: [] }
  ) ?? { recordingRules: [], alertingRules: [] };

  const populateDefaultAlerts = async () => {
    setUpdatingDefaultRules(true);
    await setDefaultRules();
    setUpdatingDefaultRules(false);
  };

  const getUpdateRules = (updatedIndex: number) => async (alertValues: AlertFormValues) => {
    const updatedRule = transformAlertFormValues(alertValues);

    if (!alertRules) {
      return Promise.reject('Something went wrong');
    }

    const updatedRules = alertingRules?.map((rule, index) => {
      if (index === updatedIndex) {
        return updatedRule;
      }
      return rule;
    });
    return await setRules([...recordingRules, ...updatedRules]);
  };

  if (!instance.alertRuler && !isUnifiedAlertingEnabled) {
    return (
      <div>
        <Icon className={styles.icon} name="exclamation-triangle" />
        Synthetic Monitoring uses &nbsp;
        <a href="https://grafana.com/docs/grafana/latest/alerting/unified-alerting/" className={styles.link}>
          Unified Alerting
        </a>
        , which is not enabled in this Grafana instance. Alert rules can be added to new or existing checks in &nbsp;
        <a href="https://grafana.com" className={styles.link}>
          Grafana Cloud.
        </a>
      </div>
    );
  }

  return (
    <div>
      {!config.featureToggles.topnav && <h2>Alerts</h2>}
      <p>
        View and edit default alerts for Synthetic Monitoring here. To tie one of these alerts to a check, you must
        select the alert sensitivity from the Alerting section of the check form when creating a check.{' '}
        <a
          href="https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/configure-alerts/synthetic-monitoring-alerting/"
          className={styles.link}
        >
          Learn more about alerting for Synthetic Monitoring.
        </a>
      </p>
      {!alertRules && <Spinner />}
      {alertError && (
        <Alert title="Error fetching alert rules" severity="error">
          {alertError}
        </Alert>
      )}
      {alertRules?.length === 0 && !Boolean(alertError) && (
        <div className={styles.emptyCard}>
          <span className={styles.defaultAlerts}>
            You do not have any default alerts for Synthetic Monitoring yet. Click below to get some default alerts. You
            can also create custom alerts for checks using Grafana Cloud Alerting.
          </span>
          <Button size="md" disabled={updatingDefaultRules} onClick={populateDefaultAlerts}>
            Populate default alerts
          </Button>
        </div>
      )}
      {alertingRules.map((alertRule, index) => (
        <AlertRuleForm key={`${alertRule.alert}-${index}`} rule={alertRule} onSubmit={getUpdateRules(index)} />
      ))}
      {Boolean(alertRules?.length) ? (
        <Stack justifyContent="flex-end">
          <Button variant="destructive" type="button" onClick={() => setShowResetModal(true)}>
            Reset to defaults
          </Button>
        </Stack>
      ) : null}
      <Modal isOpen={showResetModal} title="Reset default alert rules?" onDismiss={() => setShowResetModal(false)}>
        Resetting the alert rules will overwrite any changes made in the <code>syntheticmonitoring {'>'} default</code>{' '}
        rule group.
        <Stack justifyContent="center">
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              populateDefaultAlerts();
              setShowResetModal(false);
            }}
          >
            Reset rules
          </Button>
          <Button type="button" variant="secondary" onClick={() => setShowResetModal(false)}>
            Cancel
          </Button>
        </Stack>
      </Modal>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  emptyCard: css({
    backgroundColor: theme.colors.background.secondary,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 100px',
  }),
  defaultAlerts: css({
    marginBottom: theme.spacing(4),
    textAlign: 'center',
  }),
  link: css({
    textDecoration: 'underline',
  }),
  icon: css({
    marginRight: theme.spacing(1),
  }),
});
