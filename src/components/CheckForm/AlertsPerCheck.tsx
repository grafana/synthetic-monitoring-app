import React, { useEffect, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Field, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { AlertPercentiles, CheckAlertFormType, CheckFormValues, CheckStatus, CheckType } from 'types';
import { CheckAlertsResponse } from 'datasource/responses.types';
import { getAlertCheckFormValues } from 'components/CheckEditor/transformations/toFormValues.alerts';

import { NewStatusBadge } from '../CheckEditor/FormComponents/CheckStatusInfo';
import { AlertCard } from './AlertCard';

const defaultPercentileOptions: AlertPercentiles[] = [
  AlertPercentiles.p50,
  AlertPercentiles.p90,
  AlertPercentiles.p95,
  AlertPercentiles.p99,
];

interface PredefinedAlertInterface {
  type: CheckAlertFormType;
  description: string;
  percentileOptions: AlertPercentiles[];
  supportedCheckTypes?: CheckType[];
}
const PREDEFINED_ALERTS: PredefinedAlertInterface[] = [
  {
    type: CheckAlertFormType.ProbeFailedExecutionsTooHigh,
    description:
      'Alert when the percentage of failed probe executions during the time that the alert rule evaluates is higher than the threshold',
    percentileOptions: [],
  },
  {
    type: CheckAlertFormType.HTTPRequestDurationTooHigh,
    description: 'Alert when the selected percentile(s) of the HTTP request duration is higher than the threshold',
    percentileOptions: defaultPercentileOptions,
    supportedCheckTypes: [CheckType.HTTP],
  },
  {
    type: CheckAlertFormType.HTTPTargetCertificateCloseToExpiring,
    description: 'Alert when the target certificate is close to expiring',
    percentileOptions: [],
    supportedCheckTypes: [CheckType.HTTP],
  },
  {
    type: CheckAlertFormType.PingICMPDurationTooHigh,
    description: 'Alert when the selected percentile(s) of the ICMP ping duration is higher than the threshold',
    percentileOptions: defaultPercentileOptions,
    supportedCheckTypes: [CheckType.PING],
  },
];

interface AlertsPerCheckInterface {
  checkAlerts?: CheckAlertsResponse;
  checkType: CheckType;
}

export const AlertsPerCheck = ({ checkAlerts, checkType }: AlertsPerCheckInterface) => {
  const styles = useStyles2(getStyles);

  const { getValues, setValue, control } = useFormContext<CheckFormValues>();

  useEffect(() => {
    if (!checkAlerts) {
      return;
    }
    const formAlerts = getAlertCheckFormValues(checkAlerts);
    setValue(`alerts`, formAlerts);
  }, [checkAlerts, setValue]);

  const handleSelectAlert = (type: CheckAlertFormType, forceSelection?: boolean) => {
    const alerts = getValues(`alerts`);
    if (!alerts?.[type]) {
      return;
    }
    let newAlerts;
    if (forceSelection) {
      newAlerts = { ...alerts, [type]: { ...alerts[type], isSelected: true } };
    } else {
      newAlerts = { ...alerts, [type]: { ...alerts[type], isSelected: !alerts[type].isSelected } };
    }

    setValue(`alerts`, newAlerts);
  };

  const availableAlerts = useMemo(
    () =>
      PREDEFINED_ALERTS.filter((alert) =>
        alert.supportedCheckTypes?.length ? alert.supportedCheckTypes.includes(checkType) : true
      ),
    [checkType]
  );

  return (
    <>
      <div className={styles.marginBottom}>
        <Stack alignItems={'center'}>
          <h4>Predefined alerts</h4>
          <NewStatusBadge status={CheckStatus.EXPERIMENTAL} className={styles.badge} />
        </Stack>

        <p>
          You can choose from the following predefined alerts to assign to this check and configure a threshold for
          each, including setting specific percentile values are available.
        </p>

        <Field>
          <Controller
            control={control}
            name="alerts"
            render={() => {
              return (
                <ul className={styles.list}>
                  <li>
                    {availableAlerts.map((alert) => {
                      return <AlertCard key={alert.type} predefinedAlert={alert} onSelect={handleSelectAlert} />;
                    })}
                  </li>
                </ul>
              );
            }}
          />
        </Field>
      </div>
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  marginBottom: css({
    marginBottom: theme.spacing(3),
  }),
  link: css({
    textDecoration: `underline`,
  }),
  list: css({
    display: 'grid',
    listStyle: 'none',
  }),
  badge: css({
    fontSize: theme.typography.body.fontSize,
    marginBottom: theme.spacing(1),
  }),
});
