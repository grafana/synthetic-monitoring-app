import { BaseSyntheticEvent, useCallback, useRef, useState } from 'react';
import { FieldErrors } from 'react-hook-form';
import { addRefinements } from 'schemas/forms/BaseCheckSchema';
import { browserCheckSchema } from 'schemas/forms/BrowserCheckSchema';
import { dnsCheckSchema } from 'schemas/forms/DNSCheckSchema';
import { grpcCheckSchema } from 'schemas/forms/GRPCCheckSchema';
import { httpCheckSchema } from 'schemas/forms/HttpCheckSchema';
import { multiHttpCheckSchema } from 'schemas/forms/MultiHttpCheckSchema';
import { pingCheckSchema } from 'schemas/forms/PingCheckSchema';
import { scriptedCheckSchema } from 'schemas/forms/ScriptedCheckSchema';
import { tcpCheckSchema } from 'schemas/forms/TCPCheckSchema';
import { tracerouteCheckSchema } from 'schemas/forms/TracerouteCheckSchema';

import { Check, CheckAlertDraft, CheckAlertFormRecord, CheckFormValues, CheckType, FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { AdHocCheckResponse } from 'datasource/responses.types';
import { useUpdateAlertsForCheck } from 'data/useCheckAlerts';
import { useCUDChecks, useTestCheck } from 'data/useChecks';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { useNavigation } from 'hooks/useNavigation';
import { toPayload } from 'components/CheckEditor/checkFormTransformations';
import { getAlertsPayload } from 'components/CheckEditor/transformations/toPayload.alerts';

import { broadcastFailedSubmission, findFieldToFocus } from './checkForm.utils';
import { useFormCheckType } from './useCheckType';

const schemaMap = {
  [CheckType.Browser]: browserCheckSchema,
  [CheckType.DNS]: dnsCheckSchema,
  [CheckType.GRPC]: grpcCheckSchema,
  [CheckType.HTTP]: httpCheckSchema,
  [CheckType.MULTI_HTTP]: multiHttpCheckSchema,
  [CheckType.PING]: pingCheckSchema,
  [CheckType.Scripted]: scriptedCheckSchema,
  [CheckType.TCP]: tcpCheckSchema,
  [CheckType.Traceroute]: tracerouteCheckSchema,
};

export function useCheckFormSchema(check?: Check) {
  const checkType = useFormCheckType(check);

  const schema = schemaMap[checkType];
  const withRefinements = addRefinements(schema);

  return withRefinements;
}

interface UseCheckFormProps {
  check?: Check;
  checkType: CheckType;
  onTestSuccess: (data: AdHocCheckResponse) => void;
}

export function useCheckForm({ check, checkType, onTestSuccess }: UseCheckFormProps) {
  const [submittingToApi, setSubmittingToApi] = useState(false);
  const navigate = useNavigation();
  const { updateCheck, createCheck, error } = useCUDChecks({ eventInfo: { checkType } });
  const testButtonRef = useRef<HTMLButtonElement>(null);
  const { mutate: testCheck, isPending, error: testError } = useTestCheck({ eventInfo: { checkType } });

  const navigateToChecks = useCallback(() => navigate(AppRoutes.Checks), [navigate]);
  const alertsEnabled = useFeatureFlag(FeatureName.AlertsPerCheck).isEnabled;

  const onError = (err: Error | unknown) => {
    setSubmittingToApi(false);
  };

  const { mutate: updateAlertsForCheck } = useUpdateAlertsForCheck({ onSuccess: navigateToChecks, onError });

  const onSuccess = useCallback(
    (data: Check, alerts?: CheckAlertFormRecord) => {
      if (alerts && data.id) {
        const checkAlerts: CheckAlertDraft[] = getAlertsPayload(alerts, data.id);
        return updateAlertsForCheck({ alerts: checkAlerts, checkId: data.id });
      }
      return navigateToChecks();
    },
    [updateAlertsForCheck, navigateToChecks]
  );

  const mutateCheck = useCallback(
    (newCheck: Check, alerts?: CheckAlertFormRecord) => {
      setSubmittingToApi(true);

      if (check?.id) {
        return updateCheck(
          {
            id: check.id,
            tenantId: check.tenantId,
            ...newCheck,
          },
          { onSuccess: (data) => onSuccess(data, alerts), onError }
        );
      }

      return createCheck(newCheck, { onSuccess: (data) => onSuccess(data, alerts), onError });
    },
    [check?.id, check?.tenantId, createCheck, updateCheck, onSuccess]
  );

  const handleValid = useCallback(
    (checkValues: CheckFormValues, event: BaseSyntheticEvent | undefined) => {
      // react-hook-form doesn't let us provide SubmitEvent to BaseSyntheticEvent
      const submitter = (event?.nativeEvent as SubmitEvent).submitter;
      const toSubmit = toPayload(checkValues);

      if (submitter === testButtonRef.current) {
        return testCheck(toSubmit, { onSuccess: onTestSuccess });
      }

      mutateCheck(toSubmit, alertsEnabled ? checkValues?.alerts : undefined);
    },
    [mutateCheck, onTestSuccess, testCheck, alertsEnabled]
  );

  const handleInvalid = useCallback((errs: FieldErrors) => {
    broadcastFailedSubmission(errs, `submission`);

    // wait for the fields to be rendered after discovery
    setTimeout(() => {
      findFieldToFocus(errs);
    }, 100);
  }, []);

  return {
    error,
    testCheckError: testError,
    testCheckPending: isPending,
    testButtonRef,
    handleValid,
    handleInvalid,
    submittingToApi,
  };
}
