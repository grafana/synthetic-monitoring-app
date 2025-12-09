import { useCallback } from 'react';

import { Check, CheckAlertDraft, CheckAlertFormRecord, CheckFormValues } from '../types';

import { getAlertsPayload } from '../components/Checkster/transformations/toPayload.alerts';
import { queryClient } from '../data/queryClient';
import { useUpdateAlertsForCheck } from '../data/useCheckAlerts';
import { queryKeys, useCUDChecks } from '../data/useChecks';
import { useNavigateToCheckDashboard } from './useNavigateToCheckDashboard';

export function useHandleSubmitCheckster(initialCheck?: Check) {
  const navigateToCheckDashboard = useNavigateToCheckDashboard();

  const { mutateAsync: updateAlertsForCheck } = useUpdateAlertsForCheck({
    prevAlerts: initialCheck?.alerts,
  });

  const handleAlerts = useCallback(
    async (result: Check, alerts?: CheckAlertFormRecord) => {
      if (alerts) {
        const checkAlerts: CheckAlertDraft[] = getAlertsPayload(alerts, result.id);
        await updateAlertsForCheck({ alerts: checkAlerts, checkId: result.id! });
      }
    },
    [updateAlertsForCheck]
  );

  const { updateCheck, createCheck } = useCUDChecks();

  return useCallback(
    async (payload: Check, formValues: CheckFormValues) => {
      // todo: add try-catch
      let result;
      // TODO: Perhaps getting the Check by id and source the tenant ID from there is better than relying on a "global" variable?
      if (initialCheck && 'id' in initialCheck && initialCheck?.id) {
        result = await updateCheck({
          id: initialCheck.id,
          tenantId: initialCheck.tenantId,
          ...payload,
        });
      } else {
        result = await createCheck(payload);
      }
      await handleAlerts(result, formValues.alerts);
      await queryClient.invalidateQueries({ queryKey: queryKeys.list });

      return () => navigateToCheckDashboard(result, payload?.id === undefined);
    },
    [initialCheck, createCheck, handleAlerts, navigateToCheckDashboard, updateCheck]
  );
}
