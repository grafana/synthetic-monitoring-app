import React from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { LoadingPlaceholder, Stack, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackLinkClick } from 'features/tracking/linkEvents';

import { CheckAlertType, CheckFormValues } from 'types';
import { useNotificationRouting } from 'data/useNotificationRouting';
import { useRevalidateForm } from 'hooks/useRevalidateForm';

import { AlertsList } from './AlertsList';
import { PREDEFINED_ALERTS } from './AlertsPerCheck.constants';
import { InitialNotificationSetup } from './InitialNotificationSetup';

export const AlertsPerCheck = () => {
  const styles = useStyles2(getStyles);
  const revalidateForm = useRevalidateForm();
  const routing = useNotificationRouting();
  const { getValues, setValue, watch } = useFormContext<CheckFormValues>();

  const checkType = getValues('checkType');

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

    setValue(`alerts`, newAlerts, { shouldDirty: true });
    revalidateForm<CheckFormValues>(`alerts.${type}`);
  };

  const selectedAlerts = watch('alerts');

  if (routing.isLoading) {
    return (
      <div className={styles.loading} role="status" aria-label="Loading alerting setup" aria-busy="true">
        <LoadingPlaceholder text="Loading alerting setup..." />
      </div>
    );
  }

  return (
    <div className={styles.marginBottom}>
      <Stack direction="column" gap={2}>
        <Stack direction="column" gap={1}>
          <Text element="h2" variant="h5">
            Enable alerts for common scenarios
          </Text>
          <Text element="p" color="secondary">
            Configure thresholds below. Use{' '}
            <TextLink
              href="/alerting/new/alerting"
              external={true}
              onClick={() => {
                const url = new URL('/alerting/new/alerting', window.location.origin);
                trackLinkClick({
                  href: url.href,
                  hostname: url.hostname,
                  path: url.pathname,
                  search: url.search,
                  source: 'alerts-per-check-info-create-rule',
                });
              }}
            >
              Grafana Alerting
            </TextLink>
            {' to create custom rules and '}
            <TextLink
              href="/alerting/routes"
              external={true}
              onClick={() => {
                const url = new URL('/alerting/routes', window.location.origin);
                trackLinkClick({
                  href: url.href,
                  hostname: url.hostname,
                  path: url.pathname,
                  search: url.search,
                  source: 'alerts-per-check-info-notification-policies',
                });
              }}
            >
              notification policies
            </TextLink>{' '}
            to choose where alerts are sent.
          </Text>
        </Stack>
        <InitialNotificationSetup />
        <AlertsList
          alerts={PREDEFINED_ALERTS[checkType]}
          selectedAlerts={selectedAlerts}
          onSelectionChange={handleSelectAlert}
        />
      </Stack>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    loading: css({
      minHeight: theme.spacing(36),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    marginBottom: css({
      marginBottom: theme.spacing(3),
    }),
  };
};
