import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Check, CheckAlertDraft } from 'types';
import { AddCheckResult } from 'datasource/responses.types';
import { CheckAlertingSaveError, checkAlertRetryConflict, sameAlertSettings } from 'data/alertSetupRecovery';
import { createInitialNotificationSetup, NotificationSetupAttempt } from 'data/initialNotificationSetup';
import { setPendingAlertSetup } from 'data/pendingAlertSetup';
import { getUserPermissions } from 'data/permissions';
import { useUpdateAlertsForCheck } from 'data/useCheckAlerts';
import { QUERY_KEYS } from 'data/useChecks';
import { fetchNotificationRouting, notificationRoutingQueryKey } from 'data/useNotificationRouting';
import { getFetchErrorMessage } from 'data/utils';
import { useAlertAccessControl } from 'hooks/useAlertAccessControl';
import { useSMDS } from 'hooks/useSMDS';
import { inspectNotificationRouting } from 'components/CheckForm/AlertsPerCheck/notificationRouting';

import { getAvailableCheckName } from './checkNames';
import { templateAlertLabels } from './templateAlerts';
import { useCreateTemplateCheck } from './useCreateTemplateCheck';

const ROUTING_WARNING =
  'Notification routing is incomplete or could not be verified. Alerts may fire without notifying anyone. You can finish setup in Grafana Alerting.';

export function useSaveTemplateCheck(onComplete: (check: AddCheckResult) => void) {
  const smDS = useSMDS();
  const queryClient = useQueryClient();
  const createMutation = useCreateTemplateCheck();
  const alertMutation = useUpdateAlertsForCheck();
  const access = useAlertAccessControl();
  const inProgress = useRef(false);
  const [busy, setBusy] = useState(false);
  const [createdCheck, setCreatedCheck] = useState<AddCheckResult>();
  const [error, setError] = useState<unknown>();

  async function run(action: () => Promise<void>) {
    if (inProgress.current) {
      return;
    }
    inProgress.current = true;
    setBusy(true);
    setError(undefined);
    try {
      await action();
    } catch (error) {
      setError(error);
    } finally {
      inProgress.current = false;
      setBusy(false);
    }
  }

  async function retryAlerting() {
    if (!(error instanceof CheckAlertingSaveError)) {
      return;
    }
    await run(async () => {
      await error.retry();
      error.continueToCheck();
    });
  }

  async function inspect(check: Check, alerts: CheckAlertDraft[]) {
    const [routing, labelMode] = await Promise.all([fetchNotificationRouting(), smDS.getLabelMode()]);
    return {
      routing,
      states: alerts.map((alert) =>
        inspectNotificationRouting(
          routing.trees,
          routing.contactPoints,
          templateAlertLabels(check, alert, labelMode.mode)
        )
      ),
    };
  }

  async function save(check: Check, alerts: CheckAlertDraft[], emails: string) {
    if (createdCheck) {
      return;
    }
    await run(async () => {
      const setup: NotificationSetupAttempt | undefined = alerts.length && emails.trim() ? { emails } : undefined;
      let verifyAfterSave = Boolean(setup);
      if (alerts.length && !setup) {
        try {
          const checks = getUserPermissions().canReadChecks ? await smDS.listChecks() : [];
          const candidate = { ...check, job: getAvailableCheckName(check, checks) };
          const { states } = await inspect(candidate, alerts);
          verifyAfterSave = states.every(({ status }) => status === 'configured');
        } catch {
          // Missing or unavailable routing is shown inline and does not block saving.
        }
      }

      const result = await createMutation.mutateAsync(check);
      setCreatedCheck(result);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
      const checkId = result.id!;
      const complete = () => onComplete(result);
      let alertsSaved = alerts.length === 0;
      let firstAttempt = true;
      const finish = async (): Promise<void> => {
        const errors: string[] = [];
        if (!alertsSaved) {
          setPendingAlertSetup(queryClient, checkId, { alerts, previousAlerts: [] });
          try {
            if (!access.canWriteAlerts || !getUserPermissions().canWriteAlerts) {
              throw new Error('You do not have permission to create alerts. Ask an administrator to complete setup.');
            }
            if (!firstAttempt) {
              const current = await smDS.listAlertsForCheck(checkId);
              checkAlertRetryConflict(current.alerts, [], alerts);
              alertsSaved = sameAlertSettings(current.alerts, alerts);
            }
            if (!alertsSaved) {
              await alertMutation.mutateAsync({ checkId, alerts });
            }
            alertsSaved = true;
            setPendingAlertSetup(queryClient, checkId, null);
          } catch (error) {
            errors.push(getFetchErrorMessage(error, 'Alert creation failed.'));
          }
        }
        firstAttempt = false;
        if (setup) {
          try {
            await createInitialNotificationSetup(setup);
            await queryClient.invalidateQueries({ queryKey: notificationRoutingQueryKey() });
          } catch (error) {
            errors.push(getFetchErrorMessage(error, 'Notification setup failed. Review it in Grafana Alerting.'));
          }
        }
        if (verifyAfterSave && !errors.length) {
          // The API may have selected a different name after a conflict.
          // Check destinations using the saved check, not the earlier preview.
          try {
            const { states } = await inspect(result, alerts);
            if (states.some(({ status }) => status !== 'configured')) {
              errors.push(ROUTING_WARNING);
            }
          } catch {
            errors.push(ROUTING_WARNING);
          }
        }
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
        if (errors.length) {
          throw new CheckAlertingSaveError(errors.join(' '), finish, complete);
        }
      };

      await finish();
      complete();
    });
  }

  return { save, retryAlerting, busy, error, createdCheck };
}

export type TemplateCheckSaveState = ReturnType<typeof useSaveTemplateCheck>;
