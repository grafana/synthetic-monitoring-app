import React, { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom-v5-compat';
import { PluginPage } from '@grafana/runtime';

import { Check, CheckAlertDraft, CheckAlertFormRecord, CheckFormValues, CheckType, FeatureName } from 'types';
import { queryClient } from 'data/queryClient';
import { useUpdateAlertsForCheck } from 'data/useCheckAlerts';
import { queryKeys, useChecks, useCUDChecks } from 'data/useChecks';
import { useNavigateToCheckDashboard } from 'hooks/useNavigateToCheckDashboard';

import { useFeatureFlag } from '../../../hooks/useFeatureFlag';
import { Checkster } from '../Checkster';
import { ChecksterProvider } from '../contexts/ChecksterContext';
import { getAlertsPayload } from '../transformations/toPayload.alerts';

export function DevChecksterPage() {
  const [params] = useSearchParams({});
  const { data: checks, isLoading } = useChecks();

  const checkType = params.get('checkType');
  const id = params.get('id');

  const check = useMemo(() => {
    if (isLoading) {
      return undefined;
    }

    if (id) {
      const idInt = Number(id);
      return checks?.find((check) => check.id === idInt);
    }

    if (checkType) {
      return { type: checkType as CheckType, alerts: undefined }; // FIXME: alerts added to silence error, no other reason
    }

    return undefined;
  }, [checkType, checks, id, isLoading]);

  // Example
  const { mutateAsync: updateAlertsForCheck } = useUpdateAlertsForCheck({
    prevAlerts: check?.alerts,
  });

  const navigateToCheckDashboard = useNavigateToCheckDashboard();

  const handleAlerts = useCallback(
    async (result: Check, alerts?: CheckAlertFormRecord) => {
      if (alerts) {
        const checkAlerts: CheckAlertDraft[] = getAlertsPayload(alerts, result.id);
        await updateAlertsForCheck({ alerts: checkAlerts, checkId: result.id! });
      }
    },
    [updateAlertsForCheck]
  );

  const alertsEnabled = useFeatureFlag(FeatureName.AlertsPerCheck).isEnabled;
  const { updateCheck, createCheck } = useCUDChecks(); // Omitting eventInfo - TODO: Follow-up on that, use error from `useCUDChecks`

  const handleSubmit = useCallback(
    async (payload: Check, formValues: CheckFormValues) => {
      // todo: add try-catch
      let result;
      // TODO: Perhaps getting the Check by id and source the tenant ID from there is better than relying on a "global" variable?
      if (check && 'id' in check && check?.id) {
        result = await updateCheck({
          id: check.id,
          tenantId: check.tenantId,
          ...payload,
        });
      } else {
        result = await createCheck(payload);
      }
      await handleAlerts(result, alertsEnabled ? formValues.alerts : undefined);
      await queryClient.invalidateQueries({ queryKey: queryKeys.list });
      navigateToCheckDashboard(result, payload?.id !== undefined);
    },
    [alertsEnabled, check, createCheck, handleAlerts, navigateToCheckDashboard, updateCheck]
  );

  if (isLoading) {
    return <div>Loading checks...</div>;
  }

  return (
    <PluginPage>
      <ChecksterProvider check={check}>
        <Checkster onSave={handleSubmit} />
      </ChecksterProvider>
    </PluginPage>
  );
}
