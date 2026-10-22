import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Stack, Text, TextLink } from '@grafana/ui';

import { Check, CheckAlertError, CheckType } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { AlertSettingsConflictError, checkAlertRetryConflict, sameAlertSettings } from 'data/alertSetupRecovery';
import { usePendingAlertSetup } from 'data/pendingAlertSetup';
import { useUserPermissions } from 'data/permissions';
import { QUERY_KEYS as ALERT_QUERY_KEYS, useListAlertsForCheck, useUpdateAlertsForCheck } from 'data/useCheckAlerts';
import { QUERY_KEYS } from 'data/useChecks';
import { useLabelMode } from 'data/useLabelMode';
import { useNotificationRouting } from 'data/useNotificationRouting';
import { useCheckFolderAccess } from 'hooks/useCheckFolderAccess';
import { useSMDS } from 'hooks/useSMDS';
import { generateAlertLabels } from 'components/CheckForm/AlertsPerCheck/alertRoutingUtils';
import { PREDEFINED_ALERTS } from 'components/CheckForm/AlertsPerCheck/AlertsPerCheck.constants';
import { inspectNotificationRouting } from 'components/CheckForm/AlertsPerCheck/notificationRouting';

function describeAlertSetupError(error?: CheckAlertError): string {
  switch (error) {
    case CheckAlertError.QuotaLimitReached:
      return 'The alerting limit has been reached. Ask an administrator to review the stack’s limits.';
    case CheckAlertError.HostedGrafanaInstanceLoading:
      return 'Grafana is still starting. Alert setup could not be completed yet.';
    default:
      return 'The alert rule could not be updated yet.';
  }
}

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
    if (!alertsQuery.isError && alerts && pending && sameAlertSettings(alerts, pending.alerts)) {
      clear();
    }
  }, [alertsQuery.isError, alerts, pending, clear]);

  const retry = async () => {
    if (!pending) {
      return;
    }
    setRetrying(true);
    setRetryError(undefined);
    try {
      const current = await smDS.listAlertsForCheck(checkId);
      const desired = pending.alerts;
      checkAlertRetryConflict(current.alerts, pending.previousAlerts, desired);
      // A lost response may hide a successful save. An unchanged PUT cannot
      // retry server-side rule creation, which the backend retries itself.
      if (!sameAlertSettings(current.alerts, desired)) {
        await update.mutateAsync({ checkId, alerts: desired });
      } else {
        client.setQueryData([...ALERT_QUERY_KEYS.listAlertsForCheck, checkId], current);
      }
      clear();
      await client.invalidateQueries({ queryKey: QUERY_KEYS.list });
    } catch (error) {
      setRetryError(
        error instanceof AlertSettingsConflictError
          ? error.message
          : 'Alerts could not be saved. Try again or review the alert settings.'
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
    return null;
  }
  if (alertsQuery.isError || !alerts) {
    return (
      <Alert
        severity="warning"
        title="Alerting status could not be verified"
        bottomSpacing={0}
        buttonContent="Retry"
        onRemove={() => alertsQuery.refetch()}
      >
        The alert configuration could not be loaded. {editLink}
      </Alert>
    );
  }
  const alertsWithErrors = alerts.filter(({ status, error }) => status !== 'OK' && error);
  if (pending || alertsWithErrors.length) {
    return (
      <Alert severity="warning" title="Alerting setup is incomplete" bottomSpacing={0}>
        <Stack direction="column" gap={1}>
          {pending && <Text>The last attempt to save alerts did not complete.</Text>}
          {alertsWithErrors.map((alert) => (
            <Text key={alert.name} variant="bodySmall">
              {PREDEFINED_ALERTS[checkType].find(({ type }) => type === alert.name)?.category ?? 'Alert'}:{' '}
              {describeAlertSetupError(alert.error)}
            </Text>
          ))}
          {retryError && <Text color="error">{retryError}</Text>}
          <Stack gap={2} alignItems="center">
            {pending && canRetry && (
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
            {!pending && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={alertsQuery.isFetching}
                icon={alertsQuery.isFetching ? 'spinner' : 'sync'}
                onClick={() => alertsQuery.refetch()}
              >
                Refresh status
              </Button>
            )}
            {editLink}
          </Stack>
        </Stack>
      </Alert>
    );
  }
  if (!alerts.length || routing.isLoading || labelMode.isLoading) {
    return null;
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
    const allDestinationsMissing = states?.every(
      (state) => state.status === 'missing' && state.destinations.every(({ status }) => status === 'missing')
    );
    const routingWarning = allDestinationsMissing
      ? 'No notification destination is configured for this check.'
      : missing
        ? 'Some notification destinations for this check are not configured.'
        : 'The notification destinations for this check could not be verified.';
    return (
      <NotificationRoutingWarning
        key={`${checkId}:${routingWarning}`}
        message={routingWarning}
        missing={Boolean(missing)}
      />
    );
  }
  return null;
}

function NotificationRoutingWarning({ message, missing }: { message: string; missing: boolean }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <Alert
      severity="warning"
      title={missing ? 'Alerting setup is incomplete' : 'Alerting setup could not be verified'}
      bottomSpacing={0}
      onRemove={() => setDismissed(true)}
    >
      {message}{' '}
      {missing ? (
        <>
          Configure a{' '}
          <TextLink href="/alerting/notifications" external>
            contact point
          </TextLink>{' '}
          and select it in a{' '}
          <TextLink href="/alerting/routes" external>
            notification policy
          </TextLink>{' '}
          that matches this check’s alert labels.
        </>
      ) : (
        <>
          Review the{' '}
          <TextLink href="/alerting/routes" external>
            notification policies
          </TextLink>{' '}
          that match this check’s alert labels and check the{' '}
          <TextLink href="/alerting/notifications" external>
            contact points
          </TextLink>{' '}
          they use.
        </>
      )}
    </Alert>
  );
}
