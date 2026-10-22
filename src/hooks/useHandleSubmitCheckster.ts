import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { trackFaroUserAction } from 'features/tracking/userAction';

import { Check, CheckAlertDraft, CheckFormValues } from 'types';
import { FaroUserAction } from 'faro';
import { CheckAlertingSaveError, checkAlertRetryConflict, sameAlertSettings } from 'data/alertSetupRecovery';
import { createInitialNotificationSetup, NotificationSetupAttempt } from 'data/initialNotificationSetup';
import { setPendingAlertSetup } from 'data/pendingAlertSetup';
import { getUserPermissions } from 'data/permissions';
import { QUERY_KEYS as ALERT_QUERY_KEYS, useUpdateAlertsForCheck } from 'data/useCheckAlerts';
import { QUERY_KEYS, useCUDChecks } from 'data/useChecks';
import { notificationRoutingQueryKey } from 'data/useNotificationRouting';
import { getFetchErrorMessage } from 'data/utils';
import { getAlertsPayload } from 'components/Checkster/transformations/toPayload.alerts';

import { useNavigateToCheckDashboard } from './useNavigateToCheckDashboard';
import { useSMDS } from './useSMDS';

interface SubmitOptions {
  /** Runs once the check itself is saved, before its alerts, so a failed alerts save cannot skip it. */
  onCheckSaved?: (saved: Check) => void;
}

export function useHandleSubmitCheckster(initialCheck?: Check, { onCheckSaved }: SubmitOptions = {}) {
  const navigateToCheckDashboard = useNavigateToCheckDashboard();
  const queryClient = useQueryClient();
  const smDS = useSMDS();
  const { mutateAsync: updateAlertsForCheck } = useUpdateAlertsForCheck({ prevAlerts: initialCheck?.alerts });
  const { updateCheck, createCheck } = useCUDChecks();

  return useCallback(
    async (payload: Check, formValues: CheckFormValues) => {
      const desired = getAlertsPayload(formValues.alerts);
      const previous: CheckAlertDraft[] = initialCheck?.alerts ?? [];
      const isUpdate = Boolean(initialCheck?.id);
      const canWriteAlerts = getUserPermissions().canWriteAlerts;
      // Routing warnings are shown inline. If the user requested shared email
      // setup, its write path still rechecks permissions and current policies.
      const setup: NotificationSetupAttempt | undefined =
        desired.length && formValues.notificationEmails?.trim() ? { emails: formValues.notificationEmails } : undefined;

      trackFaroUserAction(isUpdate ? FaroUserAction.CheckUpdateSubmitClicked : FaroUserAction.CheckCreateSubmitClicked);
      const result = isUpdate
        ? await updateCheck({ ...payload, id: initialCheck!.id, tenantId: initialCheck!.tenantId })
        : await createCheck(payload);
      onCheckSaved?.(result);
      const checkId = result.id!;
      const continueToCheck = () => navigateToCheckDashboard(result, !isUpdate);
      let alertsSaved = formValues.alerts === undefined || (!canWriteAlerts && sameAlertSettings(desired, previous));
      let firstAttempt = true;

      const finish = async (): Promise<void> => {
        const errors: string[] = [];
        if (!alertsSaved) {
          setPendingAlertSetup(queryClient, checkId, { alerts: desired, previousAlerts: previous });
          try {
            if (!getUserPermissions().canWriteAlerts) {
              throw new Error('You do not have permission to save alerts. Ask an administrator to complete setup.');
            }
            if (!firstAttempt) {
              const current = await smDS.listAlertsForCheck(checkId);
              checkAlertRetryConflict(current.alerts, previous, desired);
              if (sameAlertSettings(current.alerts, desired)) {
                alertsSaved = true;
                queryClient.setQueryData([...ALERT_QUERY_KEYS.listAlertsForCheck, checkId], current);
              }
            }
            if (!alertsSaved) {
              await updateAlertsForCheck({ alerts: desired, checkId });
            }
            alertsSaved = true;
            setPendingAlertSetup(queryClient, checkId, null);
          } catch (error) {
            errors.push(error instanceof Error ? error.message : 'Alert creation failed.');
          }
        }
        firstAttempt = false;
        if (setup) {
          try {
            await createInitialNotificationSetup(setup);
          } catch (error) {
            errors.push(
              getFetchErrorMessage(
                error,
                'Notification setup failed. Review the contact point and policies in Grafana Alerting.'
              )
            );
          }
        }
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list }),
          queryClient.invalidateQueries({ queryKey: notificationRoutingQueryKey() }),
        ]);
        if (errors.length) {
          throw new CheckAlertingSaveError(errors.join(' '), finish, continueToCheck);
        }
      };

      await finish();
      return continueToCheck;
    },
    [
      initialCheck,
      smDS,
      queryClient,
      updateCheck,
      createCheck,
      updateAlertsForCheck,
      navigateToCheckDashboard,
      onCheckSaved,
    ]
  );
}
