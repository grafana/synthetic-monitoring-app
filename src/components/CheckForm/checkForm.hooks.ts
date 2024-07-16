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
import { PROBES_SELECT_ID } from 'components/CheckEditor/CheckProbes';
import { SCRIPT_TEXTAREA_ID } from 'components/CheckEditor/FormComponents/ScriptedCheckScript';
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
  const { updateCheck, createCheck, error } = useCUDChecks({ eventInfo: { checkType } });
  const testButtonRef = useRef<HTMLButtonElement>(null);
  const { mutate: testCheck, isPending, error: testError } = useTestCheck({ eventInfo: { checkType } });

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
  };
}

function findFieldToFocus(errs: FieldErrors<CheckFormValues>) {
  const fieldToFocus = getFirstInput(errs);

  if (fieldToFocus instanceof HTMLElement) {
    fieldToFocus.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    fieldToFocus.focus();
  }
}

function getFirstInput(errs: FieldErrors<CheckFormValues>) {
  const errKeys = flattenKeys(errs);
  const onPageInputs = document.querySelectorAll(errKeys.map((key) => `[name="${key}"]`).join(','));
  const firstInput = onPageInputs[0];

  if (firstInput) {
    return firstInput;
  }

  return searchForSpecialInputs(errKeys);
}

function searchForSpecialInputs(errKeys: string[] = []) {
  const probes = errKeys.includes(`probes`) && document.querySelector(`#${PROBES_SELECT_ID} input`);
  const script =
    errKeys.includes(`settings.scripted.script`) && document.querySelector(`#${SCRIPT_TEXTAREA_ID} textarea`);

  if (probes) {
    return probes;
  }

  if (script) {
    return script;
  }

  return null;
}

export function flattenKeys(errs: FieldErrors<CheckFormValues>) {
  const build: string[] = [];

  Object.entries(errs).forEach(([key, value]) => {
    if (isBottomOfPath(value)) {
      build.push(key);
    } else {
      build.push(...flattenKeys(value).map((subKey) => `${key}.${subKey}`));
    }
  });

  return build;
}

function isBottomOfPath(obj: any) {
  const keys = Object.keys(obj);

  if (keys.every((key) => [`ref`, `message`, `type`].includes(key))) {
    return true;
  }

  return false;
}

export function broadcastFailedSubmission(errs: FieldErrors, source?: `submission` | `collapsible`) {
  requestAnimationFrame(() => {
    document.dispatchEvent(new CustomEvent(CHECK_FORM_ERROR_EVENT, { detail: { errs, source } }));
  });
}
