import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Alert, Button, Modal, Spinner, Stack, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { AlertFormValues, AlertRule } from 'types';
import { useAlertAccessControl } from 'hooks/useAlertAccessControl';
import { useAlerts } from 'hooks/useAlerts';
import { transformAlertFormValues } from 'components/alertingTransformations';
import { AlertRuleForm } from 'components/AlertRuleForm';

import { ContactAdminAlert } from './ContactAdminAlert';

type SplitAlertRules = {
  recordingRules: AlertRule[];
  alertingRules: AlertRule[];
};

export const AlertingPage = () => {
  return (
    <PluginPage renderTitle={() => <h1>Alerts (Legacy)</h1>}>
      <Alerting />
    </PluginPage>
  );
};

const Alerting = () => {
  const styles = useStyles2(getStyles);
  const { canReadAlerts } = useAlertAccessControl();

  return (
    <div>
      <Alert title="Legacy Alerting System" severity="info">
        <p>
          This page shows <strong>legacy alerts</strong> that use the alert sensitivity system (High, Medium, Low).
          These alerts are applied globally and configured by selecting an alert sensitivity when creating or editing
          checks.
        </p>
        <p>
          We recommend using the new <strong>per-check alerts</strong> system instead. Per-check alerts allow you to set
          specific thresholds and conditions for individual checks. You can configure per-check alerts in the
          &ldquo;Alerting&rdquo; section when creating or editing any check.
        </p>
        <p>
          <TextLink
            href="https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/configure-alerts/configure-per-check-alerts/"
            external={true}
          >
            Learn more about alerting for Synthetic Monitoring
          </TextLink>
        </p>
      </Alert>

      <div className={styles.contentSection}>
        <p>
          View and edit default alerts for Synthetic Monitoring here. To tie one of these alerts to a check, you must
          select the alert sensitivity from the Alerting section of the check form when creating a check.
        </p>
        {canReadAlerts ? (
          <AlertingPageContent />
        ) : (
          <ContactAdminAlert title="Insufficient Permissions" missingPermissions={['datasources:read']} />
        )}
      </div>
    </div>
  );
};

const AlertingPageContent = () => {
  const styles = useStyles2(getStyles);
  const [updatingDefaultRules, setUpdatingDefaultRules] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const { alertRules, setDefaultRules, setRules, alertError } = useAlerts();
  const { canWriteAlerts, hasWriterRole } = useAlertAccessControl();

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

  return (
    <>
      {!alertRules && <Spinner />}
      {alertError && (
        <Alert title="Error fetching alert rules" severity="error">
          {alertError}
        </Alert>
      )}
      {hasWriterRole && !canWriteAlerts && (
        <ContactAdminAlert title="Insufficient Permissions" missingPermissions={['alert.instances.external:write']} />
      )}
      {alertRules?.length === 0 && !Boolean(alertError) && (
        <div className={styles.emptyCard}>
          <span className={styles.defaultAlerts}>
            You do not have any default alerts for Synthetic Monitoring yet. Click below to get some default alerts. You
            can also create custom alerts for checks using Grafana Cloud Alerting.
          </span>
          <Button size="md" disabled={updatingDefaultRules || !canWriteAlerts} onClick={populateDefaultAlerts}>
            Populate default alerts
          </Button>
        </div>
      )}
      {alertingRules.map((alertRule, index) => (
        <AlertRuleForm
          key={`${alertRule.alert}-${index}`}
          rule={alertRule}
          onSubmit={getUpdateRules(index)}
          canEdit={canWriteAlerts}
        />
      ))}
      {Boolean(alertRules?.length) ? (
        <Stack justifyContent="flex-end">
          <Button
            disabled={!canWriteAlerts}
            variant="destructive"
            type="button"
            onClick={() => setShowResetModal(true)}
          >
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
    </>
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
  contentSection: css({
    marginTop: theme.spacing(2),
  }),
});
