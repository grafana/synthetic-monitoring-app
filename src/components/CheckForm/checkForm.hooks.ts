import { BaseSyntheticEvent, useCallback } from 'react';
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
import { useCUDChecks } from 'data/useChecks';
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

export function useCheckFormSchema() {
  const checkType = useFormCheckType();

  return schemaMap[checkType];
}

export function useCheckForm({ check, checkType }: { check?: Check; checkType: CheckType }) {
  const navigate = useNavigation();
  const { updateCheck, createCheck } = useCUDChecks({ eventInfo: { checkType } });

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
      const toSubmit = toPayload(checkValues);

      mutateCheck(toSubmit);
    },
    [mutateCheck]
  );

  const handleInvalid = useCallback((errs: FieldErrors) => {
    document.dispatchEvent(new CustomEvent(CHECK_FORM_ERROR_EVENT, { detail: errs }));
  }, []);

  return {
    handleValid,
    handleInvalid,
  };
}
