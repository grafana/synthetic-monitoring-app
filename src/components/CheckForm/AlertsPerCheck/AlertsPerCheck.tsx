import React, { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Field, Stack, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckAlertType, CheckFormValues } from 'types';
import { useRevalidateForm } from 'hooks/useRevalidateForm';

import { AlertsList } from './AlertsList';
import { PREDEFINED_ALERTS, PredefinedAlertInterface } from './AlertsPerCheck.constants';

export const AlertsPerCheck = () => {
  const styles = useStyles2(getStyles);
  const revalidateForm = useRevalidateForm();
  const { getValues, setValue, control } = useFormContext<CheckFormValues>();

  const checkType = getValues('checkType');

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
