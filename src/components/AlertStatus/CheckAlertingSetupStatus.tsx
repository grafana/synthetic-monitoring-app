import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Stack, Text, TextLink } from '@grafana/ui';

import { AlertSensitivity, Check, CheckAlertDraft, CheckType } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { checkAlertRetryConflict, sameAlertSettings } from 'data/alertSetupRecovery';
import { usePendingAlertSetup } from 'data/pendingAlertSetup';
import { useUserPermissions } from 'data/permissions';
import { useListAlertsForCheck, useUpdateAlertsForCheck } from 'data/useCheckAlerts';
import { QUERY_KEYS } from 'data/useChecks';
import { useLabelMode } from 'data/useLabelMode';
import { useNotificationRouting } from 'data/useNotificationRouting';
import { useCheckFolderAccess } from 'hooks/useCheckFolderAccess';
import { useSMDS } from 'hooks/useSMDS';
import { generateAlertLabels } from 'components/CheckForm/AlertsPerCheck/alertRoutingUtils';
import { inspectNotificationRouting } from 'components/CheckForm/AlertsPerCheck/notificationRouting';

export function CheckAlertingSetupStatus({ check, checkType }: { check: Check; checkType: CheckType }) {
  const checkId = check.id!;
  const alertsQuery = useListAlertsForCheck(checkId);
  const routing = useNotificationRouting();
  const labelMode = useLabelMode();
  const { pending, clear } = usePendingAlertSetup(checkId);
  const { canWriteAlerts } = useUserPermissions();
  const { getPermissions } = useCheckFolderAccess([check]);
  const canRetry = canWriteAlerts && getPermissions(check).canWrite;
  const smDS = useSMDS();
  const client = useQueryClient();
  const update = useUpdateAlertsForCheck({ prevAlerts: alertsQuery.data });
  const [retryError, setRetryError] = useState<string>();
  const [retrying, setRetrying] = useState(false);
  const alerts = alertsQuery.data;

  useEffect(() => {
    if (
      !alertsQuery.isError &&
      alerts &&
      pending &&
      sameAlertSettings(alerts, pending.alerts) &&
      alerts.every(({ status }) => status === 'OK')
    ) {
      clear();
    }
  }, [alertsQuery.isError, alerts, pending, clear]);

  const retry = async () => {
    setRetrying(true);
    setRetryError(undefined);
    try {
      const current = await smDS.listAlertsForCheck(checkId);
      const desired: CheckAlertDraft[] = pending?.alerts ?? alerts ?? [];
      checkAlertRetryConflict(current.alerts, pending?.previousAlerts ?? alerts ?? [], desired);
      await update.mutateAsync({
        checkId,
        alerts: desired.map(({ name, threshold, period, runbookUrl }) => ({ name, threshold, period, runbookUrl })),
      });
      clear();
      await client.invalidateQueries({ queryKey: QUERY_KEYS.list });
    } catch (error) {
      setRetryError(
        error instanceof Error ? error.message : 'Alert creation failed. Try again or review the check settings.'
      );
    } finally {
      setRetrying(false);
    }
  };

  const editLink = (
    <TextLink href={`${generateRoutePath(AppRoutes.EditCheck, { id: checkId })}?section=alerting`}>
      Edit alerts
    </TextLink>
  );
  if (alertsQuery.isLoading) {
    return <Text color="secondary">Checking alerting status...</Text>;
  }
  if (alertsQuery.isError || !alerts) {
    return (
      <Alert
        severity="warning"
        title="Alerting status could not be verified"
        buttonContent="Retry"
        onRemove={() => alertsQuery.refetch()}
      >
        The alert configuration could not be loaded. {editLink}
      </Alert>
    );
  }
  const hasPendingAlerts = alerts.some(({ status }) => status !== 'OK');
  if (pending || hasPendingAlerts) {
    return (
      <Alert severity="warning" title="Alerting setup is incomplete">
        <Stack direction="column" gap={1}>
          <Text>
            {pending
              ? 'The last attempt to save alerts did not complete.'
              : 'Some alert rules have not been created successfully yet.'}
          </Text>
          {alerts
            .filter(({ status }) => status !== 'OK')
            .map((alert) => (
              <Text key={alert.name} variant="bodySmall">
                {alert.name}: {alert.error || alert.status}
              </Text>
            ))}
          {retryError && <Text color="error">{retryError}</Text>}
          <Stack gap={2} alignItems="center">
            {canRetry && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={retrying}
                icon={retrying ? 'spinner' : 'sync'}
                onClick={retry}
              >
                Retry alert creation
              </Button>
            )}
            {editLink}
          </Stack>
        </Stack>
      </Alert>
    );
  }
  if (!alerts.length) {
    return (
      <Stack gap={2} alignItems="center">
        <Text color="secondary">
          {check.alertSensitivity && check.alertSensitivity !== AlertSensitivity.None
            ? 'Legacy alerts enabled. Per-check alerts are off.'
            : 'Per-check alerts are off.'}
        </Text>
        {editLink}
      </Stack>
    );
  }
  if (routing.isLoading || labelMode.isLoading) {
    return <Text color="secondary">Alerting enabled. Checking notification routing...</Text>;
  }
  const states =
    routing.isError || labelMode.isError || !routing.data || !labelMode.data
      ? undefined
      : alerts.map((alert) =>
          inspectNotificationRouting(
            routing.data.trees,
            routing.data.contactPoints,
            generateAlertLabels(alert.name, {
              checkType,
              frequency: check.frequency,
              customLabels: check.labels,
              job: check.job,
              instance: check.target,
              period: alert.period,
              labelMode: labelMode.data.mode,
            })
          )
        );
  const unknown = !states || states.some(({ status }) => status === 'unknown');
  const missing = states?.some(({ status }) => status === 'missing');
  if (unknown || missing) {
    return (
      <Alert
        severity="warning"
        title={missing ? 'Alerting setup is incomplete' : 'Notification routing could not be verified'}
      >
        Alert rules are enabled.{' '}
        {missing ? 'Notifications have no usable destination.' : 'Review where notifications are sent.'}{' '}
        <TextLink href="/alerting/routes" external>
          Manage notifications
        </TextLink>
      </Alert>
    );
  }
  return (
    <Stack gap={2} alignItems="center">
      <Text>Alerting enabled</Text>
      {editLink}
    </Stack>
  );
}
