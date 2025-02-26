import React, { useEffect, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Field, LoadingPlaceholder, Stack, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckAlertFormValues, CheckAlertType, CheckFormValues, CheckStatus } from 'types';
import { useListAlertsForCheck } from 'data/useCheckAlerts';
import { NewStatusBadge } from 'components/NewStatusBadge';

import { AlertsList } from './AlertsList';
import { PREDEFINED_ALERTS, PredefinedAlertInterface } from './AlertsPerCheck.constants';

interface AlertsPerCheckProps {
  onInitAlerts: (formAlerts: Partial<Record<CheckAlertType, CheckAlertFormValues>>) => void;
}

export const AlertsPerCheck = ({ onInitAlerts }: AlertsPerCheckProps) => {
  const styles = useStyles2(getStyles);

  const { getValues, setValue, control } = useFormContext<CheckFormValues>();

  const checkId = getValues('id');
  const checkType = getValues('checkType');

  const { data: checkAlerts, isLoading, isError } = useListAlertsForCheck(checkId);

  useEffect(() => {
    if (!checkAlerts) {
      return;
    }

    onInitAlerts(
      checkAlerts.reduce((acc, alert) => {
        return {
          ...acc,
          [alert.name]: {
            threshold: alert.threshold,
            period: alert.period,
            isSelected: true,
          },
        };
      }, {})
    );

    checkAlerts.forEach((alert) => {
      setValue(
        `alerts.${alert.name}`,
        // @ts-expect-error
        {
          threshold: alert.threshold,
          isSelected: true,
        },
        { shouldDirty: false }
      );
    });
  }, [checkAlerts, setValue, onInitAlerts]);

  const groupedByCategory = useMemo(
    () =>
      PREDEFINED_ALERTS[checkType]
        .filter((alert) => !alert.hide)
        .reduce((acc: Record<string, PredefinedAlertInterface[]>, curr: PredefinedAlertInterface) => {
          const category = curr.category;
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(curr);
          return acc;
        }, {}),
    [checkType]
  );

  if (isLoading) {
    return <LoadingPlaceholder text="Loading alerts..." />;
  }

  if (isError) {
    return (
      <Alert title="There was an error fetching alerts for this check">
        Please try again or{' '}
        <TextLink href="https://grafana.com/contact" external>
          contact support
        </TextLink>
      </Alert>
    );
  }

  const handleSelectAlert = (type: CheckAlertType) => {
    const alerts = getValues('alerts');
    if (!alerts?.[type]) {
      return;
    }

    const isSelected = alerts[type].isSelected;
    const newAlerts = {
      ...alerts,
      [type]: {
        ...alerts[type],
        isSelected: !isSelected,
      },
    };

    setValue(`alerts`, newAlerts);
  };

  const selectedAlerts = getValues('alerts');

  return (
    <>
      <div className={styles.marginBottom}>
        <Stack alignItems="center">
          <h3 className={styles.title}>Predefined alerts</h3>
          <NewStatusBadge status={CheckStatus.EXPERIMENTAL} className={styles.badge} />
        </Stack>

        <p>You can choose from the following predefined alerts to assign to this check and set a threshold for each.</p>

        <Field>
          <Controller
            control={control}
            name="alerts"
            render={() => (
              <Field>
                <Stack direction="column">
                  {Object.entries(groupedByCategory).map(([category, allAlerts]) => (
                    <AlertsList
                      key={category}
                      title={category}
                      alerts={allAlerts}
                      selectedAlerts={selectedAlerts}
                      onSelectionChange={handleSelectAlert}
                    />
                  ))}
                </Stack>
              </Field>
            )}
          />
        </Field>
      </div>
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  const headingDisplay = `h4`;

  return {
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
    title: css({
      fontSize: theme.typography[headingDisplay].fontSize,
      fontWeight: theme.typography[headingDisplay].fontWeight,
      lineHeight: theme.typography[headingDisplay].lineHeight,
    }),
  };
};
