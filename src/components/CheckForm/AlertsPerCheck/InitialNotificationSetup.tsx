import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Alert, Field, Stack, Text, TextArea, TextLink } from '@grafana/ui';

import { CheckFormValues } from 'types';
import { canSetUpNotifications } from 'data/initialNotificationSetup';
import { useUserPermissions } from 'data/permissions';
import { useNotificationRouting } from 'data/useNotificationRouting';

import { getNotificationSetupEligibility } from './notificationSetup';

export function InitialNotificationSetup() {
  const {
    register,
    unregister,
    setValue,
    clearErrors,
    trigger,
    watch,
    formState: { errors, disabled },
  } = useFormContext<CheckFormValues>();
  const routing = useNotificationRouting();
  const { canWriteAlerts } = useUserPermissions();
  const hasSelectedAlerts = Object.values(watch('alerts') ?? {}).some((alert) => alert?.isSelected);
  const eligibility =
    routing.data && !routing.isError
      ? getNotificationSetupEligibility(routing.data.trees, routing.data.contactPoints)
      : undefined;
  const canConfigure = canWriteAlerts && eligibility?.status === 'available' && canSetUpNotifications(eligibility.tree);

  useEffect(() => {
    // Preserve the draft between form steps. Discard it when shared setup
    // becomes unavailable so hidden recipients cannot be used on save.
    if (!routing.isLoading && !canConfigure) {
      unregister('notificationEmails');
    }
  }, [routing.isLoading, canConfigure, unregister]);

  if (!hasSelectedAlerts) {
    return (
      <Text color="secondary">Alerts are off for this check. Custom rules in Grafana Alerting are unaffected.</Text>
    );
  }
  if (!canWriteAlerts) {
    return (
      <Alert severity="warning" title="Alerting setup needs permission" bottomSpacing={0}>
        You can save this check, but you do not have permission to create its alerts. Ask an administrator to enable
        alerting.
      </Alert>
    );
  }
  if (routing.isLoading || routing.isError || !routing.data) {
    return null;
  }
  if (eligibility?.status !== 'available') {
    return null;
  }
  if (!canSetUpNotifications(eligibility.tree)) {
    return (
      <Alert severity="warning" title="Notifications are not configured" bottomSpacing={0}>
        Ask an administrator to configure a destination in{' '}
        <TextLink href="/alerting/routes" external>
          Grafana Alerting
        </TextLink>
        .
      </Alert>
    );
  }
  const emailsField = register('notificationEmails');
  return (
    <Alert severity="info" title="Set up notifications for Synthetic Monitoring" bottomSpacing={0}>
      <Stack direction="column" gap={2}>
        <Text>
          The default contact point isn’t configured. Add email recipients for current and future Synthetic Monitoring
          checks.
        </Text>
        <Field
          label="Email addresses"
          description="Separate addresses with commas, semicolons or new lines."
          invalid={!!errors.notificationEmails}
          error={errors.notificationEmails?.message}
        >
          <TextArea
            {...emailsField}
            onChange={(event) => {
              // An unfinished address is expected while typing. Keep the draft
              // current, but validate this field only on blur or form submission.
              setValue('notificationEmails', event.currentTarget.value, { shouldDirty: true });
              clearErrors('notificationEmails');
            }}
            onBlur={(event) => {
              emailsField.onBlur(event);
              void trigger('notificationEmails');
            }}
            rows={2}
            placeholder="oncall@example.com, team@example.com"
            disabled={disabled}
          />
        </Field>
        <Text variant="bodySmall" color="secondary">
          Leave blank to set up later. Manage recipients in Grafana Alerting after saving.
        </Text>
      </Stack>
    </Alert>
  );
}
