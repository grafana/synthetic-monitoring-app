import { BaseSyntheticEvent, useCallback, useRef } from 'react';
import { FieldErrors } from 'react-hook-form';
import { DNSCheckSchema } from 'schemas/forms/DNSCheckSchema';
import { GRPCCheckSchema } from 'schemas/forms/GRPCCheckSchema';
import { HttpCheckSchema } from 'schemas/forms/HttpCheckSchema';
import { MultiHttpCheckSchema } from 'schemas/forms/MultiHttpCheckSchema';
import { PingCheckSchema } from 'schemas/forms/PingCheckSchema';
import { ScriptedCheckSchema } from 'schemas/forms/ScriptedCheckSchema';
import { TCPCheckSchema } from 'schemas/forms/TCPCheckSchema';
import { TracerouteCheckSchema } from 'schemas/forms/TracerouteCheckSchema';

import { Check, CheckFormValues, CheckType, ROUTES } from 'types';
import { AdHocCheckResponse } from 'datasource/responses.types';
import { useCUDChecks, useTestCheck } from 'data/useChecks';
import { useNavigation } from 'hooks/useNavigation';
import { toPayload } from 'components/CheckEditor/checkFormTransformations';
import { CHECK_FORM_ERROR_EVENT } from 'components/constants';

import { useFormCheckType } from './useCheckType';

const schemaMap = {
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
  const navigate = useNavigation();
  const { updateCheck, createCheck } = useCUDChecks({ eventInfo: { checkType } });
  const testButtonRef = useRef<HTMLButtonElement>(null);
  const { mutate: testCheck, isPending, error } = useTestCheck({ eventInfo: { checkType } });

  const mutateCheck = useCallback(
    (newCheck: Check) => {
      const onSuccess = (data: Check) => navigate(ROUTES.Checks);

      if (check?.id) {
        return updateCheck(
          {
            id: check.id,
            tenantId: check.tenantId,
            ...newCheck,
          },
          { onSuccess }
        );
      }

      return createCheck(newCheck, { onSuccess });
    },
    [check?.id, check?.tenantId, createCheck, navigate, updateCheck]
  );

  const handleValid = useCallback(
    (checkValues: CheckFormValues, event: BaseSyntheticEvent | undefined) => {
      // react-hook-form doesn't let us provide SubmitEvent to BaseSyntheticEvent
      const submitter = (event?.nativeEvent as SubmitEvent).submitter;
      const toSubmit = toPayload(checkValues);

      if (submitter === testButtonRef.current) {
        return testCheck(toSubmit, { onSuccess: onTestSuccess });
      }

      mutateCheck(toSubmit);
    },
    [mutateCheck, onTestSuccess, testCheck]
  );

  const handleInvalid = useCallback((errs: FieldErrors) => {
    document.dispatchEvent(new CustomEvent(CHECK_FORM_ERROR_EVENT, { detail: errs }));
  }, []);

  return {
    testCheckError: error,
    testCheckPending: isPending,
    testButtonRef,
    handleValid,
    handleInvalid,
  };
}
