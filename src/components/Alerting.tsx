import { GrafanaTheme } from '@grafana/data';
import { Button, Spinner, useStyles } from '@grafana/ui';
import React, { FC, useState } from 'react';
import { css } from 'emotion';
import { useAlerts } from 'hooks/useAlerts';
import { AlertRuleForm } from './AlertRuleForm';

const getStyles = (theme: GrafanaTheme) => ({
  emptyCard: css`
    background-color: ${theme.colors.bg2};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 100px;
  `,
  marginBottom: css`
    margin-bottom: ${theme.spacing.xl};
  `,
});

export const Alerting: FC = () => {
  const styles = useStyles(getStyles);
  const { alertRules, setDefaultRules } = useAlerts();
  const [updatingDefaultRules, setUpdatingDefaultRules] = useState(false);

  const populateDefaultAlerts = async () => {
    setUpdatingDefaultRules(true);
    const response = await setDefaultRules();
    setUpdatingDefaultRules(false);
    console.log({ response });
  };

  console.log({ alertRules });

  return (
    <div>
      <h2>Alerts</h2>
      <p>
        View and edit default alerts for Synthetic Monitoring here. To tie one of these alerts to a check, you must
        select the alert sensitivity from the Alerting section of the check form when creating a check.{' '}
        <a href="FIXME">Learn more about alerting for Synthetic Monitoring.</a>
      </p>
      {!alertRules && <Spinner />}
      {alertRules?.length === 0 && (
        <div className={styles.emptyCard}>
          <span className={styles.marginBottom}>
            You do not have any default alerts for Synthetic Monitoring yet. Click below to get some default alerts. You
            can also create custom alerts for checks using Grafana Cloud Alerting.
          </span>
          <Button size="md" disabled={updatingDefaultRules} onClick={populateDefaultAlerts}>
            Populate default alerts
          </Button>
        </div>
      )}
      {alertRules?.map(alertRule => (
        <AlertRuleForm rule={alertRule} />
      ))}
    </div>
  );
};
