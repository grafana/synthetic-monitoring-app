import React, { useEffect, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Field, LoadingPlaceholder, Stack, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckAlertFormValues, CheckAlertType, CheckFormValues } from 'types';
import { useListAlertsForCheck } from 'data/useCheckAlerts';
import { useRevalidateForm } from 'hooks/useRevalidateForm';

import { AlertsList } from './AlertsList';
import { PREDEFINED_ALERTS, PredefinedAlertInterface } from './AlertsPerCheck.constants';

interface AlertsPerCheckProps {
  onInitAlerts: (formAlerts: Partial<Record<CheckAlertType, CheckAlertFormValues>>) => void;
  isInitialized: boolean;
}

export const AlertsPerCheck = ({ onInitAlerts, isInitialized }: AlertsPerCheckProps) => {
  const styles = useStyles2(getStyles);
  const revalidateForm = useRevalidateForm();
  const { getValues, setValue, control } = useFormContext<CheckFormValues>();

  const checkId = getValues('id');
  const checkType = getValues('checkType');

  const { data: checkAlerts, isLoading, isError } = useListAlertsForCheck(checkId);

  useEffect(() => {
    if (!checkAlerts || isInitialized) {
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
          period: alert.period,
          isSelected: true,
        },
        { shouldDirty: false }
      );
    });
  }, [checkAlerts, setValue, onInitAlerts, isInitialized]);

  const groupedByCategory = useMemo(
    () =>
      PREDEFINED_ALERTS[checkType].reduce(
        (acc: Record<string, PredefinedAlertInterface[]>, curr: PredefinedAlertInterface) => {
          const category = curr.category;
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(curr);
          return acc;
        },
        {}
      ),
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
    revalidateForm<CheckFormValues>(`alerts.${type}`);
  };

  const selectedAlerts = getValues('alerts');

  return (
    <>
      <div className={styles.marginBottom}>
        <div>
          <p>
            Enable and configure thresholds for common alerting scenarios. Use Grafana Alerting to{' '}
            <TextLink href="alerting/new/alerting" external={true}>
              create a custom alert rule
            </TextLink>
            .
          </p>
        </div>

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
