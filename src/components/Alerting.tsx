import { GrafanaTheme } from '@grafana/data';
import { Button, HorizontalGroup, Icon, Modal, Spinner, useStyles, Alert } from '@grafana/ui';
import React, { FC, useState, useContext } from 'react';
import { css } from '@emotion/css';
import { useAlerts } from 'hooks/useAlerts';
import { AlertRuleForm } from './AlertRuleForm';
import {
  AlertFormValues,
  AlertRule,
  AlertFamily,
  FeatureName,
  OrgRole,
  AlertFormValidations,
  AlertFormExpressionContent,
} from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import { transformAlertFormValues, alertFamilyFromRule } from './alertingTransformations';
import { hasRole } from 'utils';
import { useFeatureFlag } from 'hooks/useFeatureFlag';

type SplitAlertRules = {
  recordingRules: AlertRule[];
  alertingRules: AlertRule[];
};

function getAlertFormParams(
  rule: AlertRule
): { validations: AlertFormValidations; expressionContent: AlertFormExpressionContent } {
  switch (alertFamilyFromRule(rule)) {
    case AlertFamily.ProbeDuration:
      return {
        validations: { threshold: { min: 1, max: 100 }, timeCount: { min: 1, max: 999 } },
        expressionContent: {
          willFireIf: 'will fire an alert if the target takes longer than',
          conditionFor: 'ms to complete for',
        },
      };

    case AlertFamily.SSLCertExpiry:
      return {
        validations: { threshold: { min: 1, max: 100 }, timeCount: { min: 1, max: 999 } },
        expressionContent: {
          willFireIf: 'will fire an alert if the SSL certificate is going to expire in less than',
          conditionFor: 'days for',
        },
      };
    case AlertFamily.ProbeSuccess:
    default:
      return {
        validations: { threshold: { min: 1, max: 100 }, timeCount: { min: 1, max: 999 } },
        expressionContent: {
          willFireIf: 'will fire an alert if less than',
          conditionFor: '% of probe sreport connection success for',
        },
      };
  }
}

const getStyles = (theme: GrafanaTheme) => ({
  emptyCard: css`
    background-color: ${theme.colors.bg2};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 100px;
  `,
  defaultAlerts: css`
    margin-bottom: ${theme.spacing.xl};
    text-align: center;
  `,
  link: css`
    text-decoration: underline;
  `,
  icon: css`
    margin-right: ${theme.spacing.xs};
  `,
});

export const Alerting: FC = () => {
  const styles = useStyles(getStyles);
  const { alertRules, setDefaultRules, setRules, alertError } = useAlerts();
  const [updatingDefaultRules, setUpdatingDefaultRules] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const { instance } = useContext(InstanceContext);
  const { isEnabled: isUnifiedAlertingEnabled } = useFeatureFlag(FeatureName.UnifiedAlerting);

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

  if (!hasRole(OrgRole.ADMIN)) {
    return (
      <div>
        <h2>Alerts</h2>
        <Icon className={styles.icon} name="exclamation-triangle" />
        Synthetic Monitoring uses &nbsp;
        <a href="https://grafana.com/docs/grafana-cloud/alerts/grafana-cloud-alerting/" className={styles.link}>
          Grafana Cloud Alerting
        </a>
        , which is not accessible for users without an admin role.
      </div>
    );
  }

  if (!instance.alertRuler && !isUnifiedAlertingEnabled) {
    return (
      <div>
        <Icon className={styles.icon} name="exclamation-triangle" />
        Synthetic Monitoring uses &nbsp;
        <a href="https://grafana.com/docs/grafana-cloud/alerts/grafana-cloud-alerting/" className={styles.link}>
          Grafana Cloud Alerting
        </a>
        , which is not accessible for Grafana instances running on-prem. Alert rules can be added to new or existing
        checks in &nbsp;
        <a href="https://grafana.com" className={styles.link}>
          Grafana Cloud.
        </a>
      </div>
    );
  }

  return (
    <div>
      <h2>Alerts</h2>
      <p>
        View and edit default alerts for Synthetic Monitoring here. To tie one of these alerts to a check, you must
        select the alert sensitivity from the Alerting section of the check form when creating a check.{' '}
        <a href="https://grafana.com/docs/grafana-cloud/synthetic-monitoring/#alerting">
          Learn more about alerting for Synthetic Monitoring.
        </a>
      </p>
      <p>
        Routes and receivers must be configured in{' '}
        <a
          href={`/a/grafana-alerting-ui-app/?tab=config`}
          className={styles.link}
          target="blank"
          rel="noopener noreferer"
        >
          Grafana Cloud Alerting Alertmanager
        </a>{' '}
        in order to be notified when an alert fires.{' '}
        <a
          href="https://grafana.com/blog/2020/02/25/step-by-step-guide-to-setting-up-prometheus-alertmanager-with-slack-pagerduty-and-gmail/"
          target="blank"
          rel="noopener noreferer"
          className={styles.link}
        >
          Learn more about configuring Alertmanager
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
      {alertingRules.map((rule, index) => {
        const { validations, expressionContent } = getAlertFormParams(rule);
        return (
          <AlertRuleForm
            key={`${rule.alert}-${index}`}
            rule={rule}
            onSubmit={getUpdateRules(index)}
            validations={validations}
            expressionContent={expressionContent}
          />
        );
      })}
      {Boolean(alertRules?.length) ? (
        <HorizontalGroup justify="flex-end">
          <Button variant="destructive" type="button" onClick={() => setShowResetModal(true)}>
            Reset to defaults
          </Button>
        </HorizontalGroup>
      ) : null}
      <Modal isOpen={showResetModal} title="Reset default alert rules?" onDismiss={() => setShowResetModal(false)}>
        Resetting the alert rules will overwrite any changes made in the <code>syntheticmonitoring {'>'} default</code>{' '}
        rule group.
        <HorizontalGroup justify="center">
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
        </HorizontalGroup>
      </Modal>
    </div>
  );
};
