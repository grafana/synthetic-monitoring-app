import { useCallback, useMemo, useState } from 'react';
import { FieldErrors, useFormContext } from 'react-hook-form';
import { useNavigate } from 'react-router-dom-v5-compat';
import { zodResolver } from '@hookform/resolvers/zod';
import { trackAdhocCreated } from 'features/tracking/checkFormEvents';
import { addRefinements } from 'schemas/forms/BaseCheckSchema';
import { ZodType } from 'zod';

import { LayoutSection, Section } from '../CheckForm/FormLayouts/Layout.types';
import {
  Check,
  CheckAlertDraft,
  CheckAlertFormRecord,
  CheckFormValues,
  CheckStatus,
  CheckType,
  CheckTypeGroup,
  FeatureName,
} from 'types';
import { getCheckType } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { AdHocCheckResponse } from 'datasource/responses.types';
import { getUserPermissions } from 'data/permissions';
import { queryClient } from 'data/queryClient';
import { useUpdateAlertsForCheck } from 'data/useCheckAlerts';
import { queryKeys, useCUDChecks, useTestCheck } from 'data/useChecks';
import { useProbes } from 'data/useProbes';
import { useCheckTypeOptions } from 'hooks/useCheckTypeOptions';
import { useCanReadLogs } from 'hooks/useDSPermission';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { useLimits } from 'hooks/useLimits';

import { layoutMap } from '../CheckForm/FormLayouts/constants';
import { fallbackCheckMap } from '../constants';
import { getAlertsPayload } from './transformations/toPayload.alerts';
import { FormSectionIndex, SCHEMA_MAP } from './CheckEditor.constants';
import {
  broadcastFailedSubmission,
  createSectionIndexMap,
  findFieldToFocus,
  getIsExistingCheck,
  getSectionOrder,
} from './CheckEditor.utils';
import { useCheckEditorContext } from './CheckEditorContext';
import { toFormValues, toPayload } from './checkFormTransformations';

function isCheckType(checkType: unknown): checkType is CheckType {
  return Object.values(CheckType).includes(checkType as CheckType);
}

function isCheckTypeGroup(subject: unknown): subject is CheckTypeGroup {
  return Object.values(CheckTypeGroup).includes(subject as CheckTypeGroup);
}

type FormCheckTypes = [CheckType, CheckTypeGroup];
type CheckTypeParam = CheckType | CheckTypeGroup | string | null | undefined;
export function useFormCheckTypes(checkOrType: Check | CheckTypeParam = CheckType.HTTP, check?: Check): FormCheckTypes {
  const options = useCheckTypeOptions();
  const fallbackResult: FormCheckTypes = [options[0].value, options[0].group];

  // By CheckTypeGroup or CheckType
  if (
    isCheckTypeGroup(checkOrType) ||
    isCheckType(checkOrType) ||
    typeof checkOrType !== 'object' ||
    checkOrType === null
  ) {
    const subject = options.filter((option) => {
      if (isCheckTypeGroup(checkOrType)) {
        return option.group === checkOrType;
      }

      if (isCheckType(checkOrType)) {
        return option.value === checkOrType;
      }

      return false;
    });

    if (subject.length === 0) {
      return fallbackResult;
    }

    return [subject[0].value, subject[0].group];
  }

  try {
    const subjectCheck = check || checkOrType;
    const checkType = getCheckType(subjectCheck.settings);
    const checkTypeGroup = options.find((option) => option.value === checkType)?.group;
    if (checkTypeGroup) {
      return [checkType, checkTypeGroup];
    }
  } catch (_error) {
    // ignore error
  }

  return fallbackResult;
}

type CheckEditorCheckMeta = {
  check?: Check;
  isNew: boolean;
  isExistingCheck: boolean;
  getIsExistingCheck: typeof getIsExistingCheck;
  schema: ZodType;
  checkType: CheckType;
  checkTypeGroup: CheckTypeGroup | undefined;
  checkState: 'new' | 'existing';
  checkTypeStatus?: {
    value: CheckStatus;
    description: string;
  };
  isOverLimit: boolean | null;
  isDisabled: boolean;
  isLoading: boolean;
  defaultFormValues: CheckFormValues;
  initialSection?: FormSectionIndex;
};

export function useCheckEditorCheckMeta(
  check?: Check,
  type?: CheckType | CheckTypeGroup | string | null
): CheckEditorCheckMeta {
  const [checkType, checkTypeGroup] = useFormCheckTypes(type, check);
  const isNew = !getIsExistingCheck(check);

  const schema = useCheckFormSchema(check ?? checkType);
  const defaultFormValues = useCheckFormDefaultValues(check ?? checkType);

  const options = useCheckTypeOptions();
  const isOverLimit = useIsOverlimit(!isNew, checkType);
  const permission = useFormPermissions();
  const isExistingCheck = getIsExistingCheck(check);
  const { isLoading: isLoadingProbes } = useProbes();

  return useMemo(() => {
    const checkOptions = options.find((option) => option.value === checkType);
    const isLoading = isOverLimit === null || isLoadingProbes;
    return {
      check,
      isNew: !isExistingCheck,
      isExistingCheck,
      getIsExistingCheck, // use this for type narrowing of `check` param
      checkState: isExistingCheck ? 'existing' : 'new',
      schema,
      checkType,
      checkTypeGroup,
      checkTypeStatus: checkOptions?.status,
      checkOptions,
      isOverLimit,
      isDisabled: isLoading || isOverLimit || !permission.canWriteChecks,
      isLoading,
      defaultFormValues,
    };
  }, [
    check,
    options,
    isOverLimit,
    isExistingCheck,
    schema,
    checkType,
    checkTypeGroup,
    permission.canWriteChecks,
    defaultFormValues,
    isLoadingProbes,
  ]);
}

export function useIsOverlimit(isExistingCheck: boolean, checkType: CheckType) {
  const { isOverBrowserLimit, isOverHgExecutionLimit, isOverCheckLimit, isOverScriptedLimit, isReady } = useLimits();
  // It should always be possible to edit existing checks
  if (isExistingCheck) {
    return false;
  }

  if (!isReady) {
    // null indicates loading/pending state
    return null;
  }

  return (
    isOverHgExecutionLimit ||
    isOverCheckLimit ||
    (checkType === CheckType.Browser && isOverBrowserLimit) ||
    ([CheckType.MULTI_HTTP, CheckType.Scripted].includes(checkType) && isOverScriptedLimit)
  );
}

export function useFormPermissions() {
  const { canWriteChecks } = getUserPermissions();
  const canReadLogs = useCanReadLogs();

  return useMemo(() => {
    return {
      canReadLogs,
      canWriteChecks,
    };
  }, [canReadLogs, canWriteChecks]);
}

export function useCheckFormSchema(checkOrType?: Check | CheckType) {
  const [checkType] = useFormCheckTypes(checkOrType);
  const schema = SCHEMA_MAP[checkType];

  return useMemo(() => {
    return addRefinements(schema);
  }, [schema]);
}

export function useCheckFormDefaultValues(checkOrType?: Check | CheckType) {
  const [checkType] = useFormCheckTypes(checkOrType);

  const checkWithFallback = isCheckType(checkOrType) || !checkOrType ? fallbackCheckMap[checkType] : checkOrType;

  return useMemo(() => {
    return toFormValues(checkWithFallback, checkType);
  }, [checkType, checkWithFallback]);
}

export function useCheckEditorApi() {
  const {
    checkMeta: { checkType, check },
  } = useCheckEditorContext();
  const { updateCheck, createCheck, error } = useCUDChecks({ eventInfo: { checkType } });

  const [isSubmittingToApi, setIsSubmittingToApi] = useState(false);

  // Alerts
  const alertsEnabled = useFeatureFlag(FeatureName.AlertsPerCheck).isEnabled;
  const { mutateAsync: updateAlertsForCheck } = useUpdateAlertsForCheck({
    prevAlerts: check?.alerts,
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

  // Post create/update navigation
  const navigate = useNavigate();
  const navigateToCheckDashboard = useCallback(
    (result: Check) => navigate(generateRoutePath(AppRoutes.CheckDashboard, { id: result.id! })),
    [navigate]
  );

  // Check mutation
  const mutateCheck = useCallback(
    async (newCheck: Check, alerts?: CheckAlertFormRecord) => {
      setIsSubmittingToApi(true);
      try {
        let result;
        if (check?.id) {
          result = await updateCheck({
            id: check.id,
            tenantId: check.tenantId,
            ...newCheck,
          });
        } else {
          result = await createCheck(newCheck);
        }
        await handleAlerts(result, alerts);
        await queryClient.invalidateQueries({ queryKey: queryKeys.list });
        navigateToCheckDashboard(result);
      } catch (e) {
        console.log(`Error while submitting check`, e);
        // swallow the error
        // it gets handled correctly by the generic hooks, and we have tests to prove that
        // this isn't strictly necessary, but jest complains about this...
      } finally {
        setIsSubmittingToApi(false);
      }
    },
    [check?.id, check?.tenantId, createCheck, updateCheck, handleAlerts, navigateToCheckDashboard]
  );

  const handleValid = useCallback(
    (checkValues: CheckFormValues) => {
      const toSubmit = toPayload(checkValues);

      mutateCheck(toSubmit, alertsEnabled ? checkValues?.alerts : undefined);
    },
    [mutateCheck, alertsEnabled]
  );

  const handleInvalid = useCallback((errs: FieldErrors) => {
    broadcastFailedSubmission(errs, `submission`);

    // wait for the fields to be rendered after discovery
    setTimeout(() => {
      findFieldToFocus(errs);
    }, 100);
  }, []);

  return useMemo(
    () => ({
      handleValid,
      handleInvalid,
      isSubmittingToApi,
      error,
    }),
    [handleValid, handleInvalid, isSubmittingToApi, error]
  );
}

/**
 * Returns a promise that resolves with form validation errors if there are any,
 * or `null` if the form passes validation.
 * The function uses `zodResolver` for schema-based validation.
 *
 * @return {() => Promise<null | FieldErrors<CheckFormValues>>} A promise that resolves to form validation errors
 * or `null` if there are no validation errors.
 *
 * Note: this must be used within a form context
 */
export function useGetFormValidationErrors(): () => Promise<null | FieldErrors<CheckFormValues>> {
  const {
    checkMeta: { schema },
  } = useCheckEditorContext();
  const { getValues } = useFormContext<CheckFormValues>();

  const resolver = useMemo(() => {
    return zodResolver(schema);
  }, [schema]);

  return useCallback(async () => {
    const values = getValues();
    // @ts-expect-error Typings does not align with the actual code
    // @see https://github.com/react-hook-form/resolvers/blob/master/zod/src/zod.ts

    const { errors } = await resolver(values, undefined, {});

    if (Object.keys(errors).length === 0) {
      return null;
    }

    return errors;
  }, [getValues, resolver]);
}

export function useRunAdhocCheck<T extends AdHocCheckResponse = AdHocCheckResponse>(): [
  (onTestSuccessCallback?: (responseData: T) => void) => Promise<void>,
  Error | null
] {
  const { trigger, getValues } = useFormContext<CheckFormValues>();
  const {
    checkMeta: { checkType, checkState },
    setActiveSectionByError,
  } = useCheckEditorContext();

  const getFormValidationErrors = useGetFormValidationErrors();
  const { mutate: testCheck, error } = useTestCheck({ eventInfo: { checkType } });

  const testCheckCallback = useCallback(
    async (onTestSuccessCallback?: (responseData: T) => void) => {
      const errors = await getFormValidationErrors();

      if (errors) {
        await trigger(); // Trigger form to show errors
        return setActiveSectionByError(errors); // @todo This was wrapped in a setTimout, was it needed?
      }

      const toSubmit = toPayload(getValues());
      return testCheck(toSubmit, {
        onSuccess: (responseData) => {
          trackAdhocCreated({ checkType, checkState });
          onTestSuccessCallback?.(responseData as T);
        },
      });
    },
    [checkState, checkType, getFormValidationErrors, getValues, setActiveSectionByError, testCheck, trigger]
  );

  return [testCheckCallback, error];
}

export function useCheckTypeFormLayout(checkType: CheckType) {
  const layout = layoutMap[checkType];

  const checkSection = layout[LayoutSection.Check];
  const checkFields = checkSection?.fields;
  const CheckComponent = checkSection?.Component;

  const uptimeSection = layout[LayoutSection.Uptime];
  const uptimeFields = uptimeSection?.fields;
  const UptimeComponent = uptimeSection?.Component;

  const probesSection = layout[LayoutSection.Probes];
  const probesFields = probesSection?.fields;
  const ProbesComponent = probesSection?.Component;

  const labelsSection = layout[LayoutSection.Labels];
  const labelsFields = labelsSection?.fields;
  const LabelsComponent = labelsSection?.Component;

  return useMemo(() => {
    return {
      checkFields: checkFields ?? [],
      uptimeFields: uptimeFields ?? [],
      probesFields: probesFields ?? [],
      labelsFields: labelsFields ?? [],
      // Explicit type argument CheckFormValues cannot be removed (usage in CheckForm.tsx requires it)
      alertsFields: [`alerts`, `alertSensitivity`] as Section<CheckFormValues>['fields'],
      CheckComponent,
      UptimeComponent,
      ProbesComponent,
      LabelsComponent,
    };
  }, [
    CheckComponent,
    LabelsComponent,
    ProbesComponent,
    UptimeComponent,
    checkFields,
    labelsFields,
    probesFields,
    uptimeFields,
  ]);
}

export function useSectionIndexMap() {
  const sectionOrder = getSectionOrder();
  return useMemo(() => {
    return createSectionIndexMap(sectionOrder);
  }, [sectionOrder]);
}
