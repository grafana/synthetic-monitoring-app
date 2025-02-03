import { BaseSyntheticEvent, useCallback, useRef, useState } from 'react';
import { FieldErrors } from 'react-hook-form';
import { BrowserCheckSchema } from 'schemas/forms/BrowserCheckSchema';
import { DNSCheckSchema } from 'schemas/forms/DNSCheckSchema';
import { GRPCCheckSchema } from 'schemas/forms/GRPCCheckSchema';
import { HttpCheckSchema } from 'schemas/forms/HttpCheckSchema';
import { MultiHttpCheckSchema } from 'schemas/forms/MultiHttpCheckSchema';
import { PingCheckSchema } from 'schemas/forms/PingCheckSchema';
import { ScriptedCheckSchema } from 'schemas/forms/ScriptedCheckSchema';
import { TCPCheckSchema } from 'schemas/forms/TCPCheckSchema';
import { TracerouteCheckSchema } from 'schemas/forms/TracerouteCheckSchema';

import { Check, CheckAlertDraft, CheckAlertFormRecord, CheckFormValues, CheckType } from 'types';
import { ROUTES } from 'routing/types';
import { AdHocCheckResponse } from 'datasource/responses.types';
import { useUpdateAlertsForCheck } from 'data/useCheckAlerts';
import { useCUDChecks, useTestCheck } from 'data/useChecks';
import { useNavigation } from 'hooks/useNavigation';
import { toPayload } from 'components/CheckEditor/checkFormTransformations';
import { getAlertsPayload } from 'components/CheckEditor/transformations/toPayload.alerts';

import { broadcastFailedSubmission, findFieldToFocus } from './checkForm.utils';
import { useFormCheckType } from './useCheckType';

const schemaMap = {
  [CheckType.Browser]: BrowserCheckSchema,
  [CheckType.DNS]: DNSCheckSchema,
  [CheckType.GRPC]: GRPCCheckSchema,
  [CheckType.HTTP]: HttpCheckSchema,
  [CheckType.MULTI_HTTP]: MultiHttpCheckSchema,
  [CheckType.PING]: PingCheckSchema,
  [CheckType.Scripted]: ScriptedCheckSchema,
  [CheckType.TCP]: TCPCheckSchema,
  [CheckType.Traceroute]: TracerouteCheckSchema,
};

export function useCheckFormSchema(check?: Check) {
  const checkType = useFormCheckType(check);

  return schemaMap[checkType];
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

  const navigateToChecks = useCallback(() => navigate(ROUTES.Checks), [navigate]);

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

      mutateCheck(toSubmit, checkValues?.alerts);
    },
    [mutateCheck, onTestSuccess, testCheck]
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
