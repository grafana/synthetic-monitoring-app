import React, { useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Field, LoadingPlaceholder, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckAlertType, CheckFormValues, CheckStatus } from 'types';
import { useListAlertsForCheck } from 'data/useCheckAlerts';
import { getAlertCheckFormValues } from 'components/CheckEditor/transformations/toFormValues.alerts';

import { NewStatusBadge } from '../../CheckEditor/FormComponents/CheckStatusInfo';
import { AlertCard } from './AlertCard';
import { PREDEFINED_ALERTS } from './AlertsPerCheck.constants';

export const AlertsPerCheck = () => {
  const styles = useStyles2(getStyles);

  const { getValues, setValue, control } = useFormContext<CheckFormValues>();

  const checkId = getValues('id');
  const checkType = getValues('checkType');

  const { data: checkAlerts, isLoading, isError } = useListAlertsForCheck(checkId);

  useEffect(() => {
    if (!checkAlerts) {
      return;
    }
    const formAlerts = getAlertCheckFormValues(checkAlerts);
    setValue(`alerts`, formAlerts);
  }, [checkAlerts, setValue]);

  if (isLoading) {
    return <LoadingPlaceholder text="Loading alerts..." />;
  }

  if (isError) {
    return (
      <Alert title="There was an error fetching alerts for this check. Please try again or contact support."></Alert>
    );
  }

  const handleSelectAlert = (type: CheckAlertType, forceSelection?: boolean) => {
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
                    {PREDEFINED_ALERTS[checkType].map((alert) => {
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