import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { trackFaroUserAction } from 'features/tracking/userAction';

import { Check, CheckAlertDraft, CheckFormValues } from 'types';
import { FaroUserAction } from 'faro';
import {
  AlertingConfirmationRequired,
  CheckAlertingSaveError,
  checkAlertRetryConflict,
  sameAlertSettings,
} from 'data/alertSetupRecovery';
import {
  canSetUpNotifications,
  createInitialNotificationSetup,
  InitialNotificationSetup,
} from 'data/initialNotificationSetup';
import { setPendingAlertSetup } from 'data/pendingAlertSetup';
import { getUserPermissions } from 'data/permissions';
import { useUpdateAlertsForCheck } from 'data/useCheckAlerts';
import { QUERY_KEYS, useCUDChecks } from 'data/useChecks';
import { fetchNotificationRouting, notificationRoutingQueryKey } from 'data/useNotificationRouting';
import { getFetchErrorMessage } from 'data/utils';
import { generateAlertLabels } from 'components/CheckForm/AlertsPerCheck/alertRoutingUtils';
import { inspectNotificationRouting } from 'components/CheckForm/AlertsPerCheck/notificationRouting';
import { getNotificationSetupEligibility } from 'components/CheckForm/AlertsPerCheck/notificationSetup';
import { getAlertsPayload } from 'components/Checkster/transformations/toPayload.alerts';

import { useNavigateToCheckDashboard } from './useNavigateToCheckDashboard';
import { useSMDS } from './useSMDS';

export function useHandleSubmitCheckster(initialCheck?: Check) {
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
      let setup: InitialNotificationSetup | undefined;
      let warning: string | undefined;

      if (desired.length) {
        if (!canWriteAlerts) {
          warning =
            'You do not have permission to create alerts. You can save the check and ask an administrator to complete alerting setup.';
        } else {
          try {
            const [routing, labelMode] = await Promise.all([fetchNotificationRouting(), smDS.getLabelMode()]);
            const eligibility = getNotificationSetupEligibility(routing.trees, routing.contactPoints);
            if (formValues.notificationEmails?.trim()) {
              if (eligibility.status !== 'available' || !canSetUpNotifications(eligibility.tree)) {
                warning =
                  'Notification setup is no longer available here. Review routing in Grafana Alerting, or save the check without changing notification policies.';
              } else {
                setup = { emails: formValues.notificationEmails };
              }
            } else {
              const states = desired.map((alert) =>
                inspectNotificationRouting(
                  routing.trees,
                  routing.contactPoints,
                  generateAlertLabels(alert.name, {
                    checkType: formValues.checkType,
                    frequency: payload.frequency,
                    customLabels: payload.labels,
                    job: payload.job,
                    instance: payload.target,
                    labelMode: labelMode.mode,
                    period: alert.period,
                  })
                )
              );
              if (states.some(({ status }) => status !== 'configured')) {
                warning =
                  'Notification routing is incomplete or could not be verified. Alerts may fire without notifying anyone. You can save the check and finish setup in Grafana Alerting.';
              }
            }
          } catch {
            warning =
              'Notification routing could not be inspected. You can save the check and review notification setup in Grafana Alerting.';
          }
        }
      }

      const save = async (): Promise<Function> => {
        trackFaroUserAction(
          isUpdate ? FaroUserAction.CheckUpdateSubmitClicked : FaroUserAction.CheckCreateSubmitClicked
        );
        const result = isUpdate
          ? await updateCheck({ ...payload, id: initialCheck!.id, tenantId: initialCheck!.tenantId })
          : await createCheck(payload);
        const checkId = result.id!;
        const continueToCheck = () => navigateToCheckDashboard(result, !isUpdate);
        let alertsSaved = formValues.alerts === undefined || (!canWriteAlerts && sameAlertSettings(desired, previous));
        let firstAttempt = true;

        const finish = async (): Promise<Function> => {
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
              }
              await updateAlertsForCheck({ alerts: desired, checkId });
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
          return continueToCheck;
        };
        return finish();
      };

      if (warning) {
        throw new AlertingConfirmationRequired(warning, save);
      }
      return save();
    },
    [initialCheck, smDS, queryClient, updateCheck, createCheck, updateAlertsForCheck, navigateToCheckDashboard]
  );
}
