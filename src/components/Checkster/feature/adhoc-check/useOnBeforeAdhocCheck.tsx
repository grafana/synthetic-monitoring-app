import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { CheckFormValues } from 'types';

import { useChecksterContext } from '../../contexts/ChecksterContext';
import { useInvalidFields } from '../../hooks/useInvalidFields';
import { toPayload } from '../../utils/adaptors';
import { useAdHocCheck } from './useAdHocCheck';

// TODO: simplify and rename
export function useOnBeforeAdhocCheck() {
  const { mutate: doAdhocCheck, data, isPending } = useAdHocCheck();
  const {
    formNavigation: { errors, sectionByErrors, completeAllSteps },
  } = useChecksterContext();
  const { trigger, getValues } = useFormContext<CheckFormValues>();
  const invalidFields = useInvalidFields();
  const [pendingGoToError, setPendingGotoError] = useState(false);

  useEffect(() => {
    if (errors && pendingGoToError) {
      completeAllSteps();
      sectionByErrors();
      setPendingGotoError(false);
    }
  }, [errors, pendingGoToError, completeAllSteps, sectionByErrors]);

  const triggerAdhocCheck = useCallback(() => {
    trigger().then((isValid) => {
      if (!isValid) {
        setPendingGotoError(true);
        return;
      }
      const formValues = getValues();
      const adHocCheckPayload = toPayload(formValues);
      if (adHocCheckPayload) {
        doAdhocCheck(adHocCheckPayload);
      }
    });
  }, [doAdhocCheck, getValues, trigger]);

  return useMemo(() => {
    return {
      disabled: !!invalidFields || isPending,
      doAdhocCheck: triggerAdhocCheck,
      data,
    };
  }, [data, invalidFields, isPending, triggerAdhocCheck]);
}
