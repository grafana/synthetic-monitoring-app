import { BaseSyntheticEvent, useCallback, useMemo, useRef, useState } from 'react';
import { FieldErrors } from 'react-hook-form';
import { useNavigate } from 'react-router-dom-v5-compat';
import { trackAdhocCreated } from 'features/tracking/checkFormEvents';
import { addRefinements } from 'schemas/forms/BaseCheckSchema';
import { ZodType } from 'zod';

import {
  Check,
  CheckAlertDraft,
  CheckAlertFormRecord,
  CheckFormValues,
  CheckStatus,
  CheckType,
  CheckTypeGroup,
  FeatureName,
} from '../../types';
import { LayoutSection } from './FormLayouts/Layout.types';
import { formatDuration } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { AdHocCheckResponse } from 'datasource/responses.types';
import { getUserPermissions } from 'data/permissions';
import { queryClient } from 'data/queryClient';
import { useUpdateAlertsForCheck } from 'data/useCheckAlerts';
import { queryKeys, useCUDChecks, useTestCheck } from 'data/useChecks';
import { useCheckTypeOptions } from 'hooks/useCheckTypeOptions';
import { useCanReadLogs } from 'hooks/useDSPermission';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { useLimits } from 'hooks/useLimits';

import { toFormValues, toPayload } from '../CheckEditor/checkFormTransformations';
import { getAlertsPayload } from '../CheckEditor/transformations/toPayload.alerts';
import { DEFAULT_FROM_TIME, fallbackCheckMap } from '../constants';
import { SectionName } from './FormLayout/FormLayout.constants';
import { layoutMap } from './FormLayouts/constants';
import {
  broadcastFailedSubmission,
  findFieldToFocus,
  getAdditionalDuration,
  getIsExistingCheck,
} from './CheckForm.utils';
import { SCHEMA_MAP } from './constants';
import { useFormCheckType, useFormCheckTypeGroup } from './useCheckType';

type CheckFormMetaReturn = {
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
  initialSection?: SectionName;
};

export function useCheckFormMeta(check?: Check, forceDisabled = false): CheckFormMetaReturn {
  const isNew = !getIsExistingCheck(check);

  // Hook usage
  const checkType = useFormCheckType(check);
  const checkTypeGroup = useFormCheckTypeGroup(check);
  const schema = useCheckFormSchema(check);
  const options = useCheckTypeOptions();
  const isOverLimit = useIsOverlimit(!isNew, checkType);
  const permission = useFormPermissions();
  const defaultFormValues = useCheckFormDefaultValues(check);
  const isExistingCheck = getIsExistingCheck(check);

  return useMemo(() => {
    const checkOptions = options.find((option) => option.value === checkType);
    const isLoading = isOverLimit === null;
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
      isOverLimit,
      isDisabled: forceDisabled || isLoading || isOverLimit || !permission.canWriteChecks,
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
    forceDisabled,
    permission.canWriteChecks,
    defaultFormValues,
  ]);
}

export function useCheckFormSchema(check?: Check) {
  const checkType = useFormCheckType(check);
  const schema = SCHEMA_MAP[checkType];

  return useMemo(() => {
    return addRefinements(schema);
  }, [schema]);
}

interface UseCheckFormProps {
  check?: Check;
  checkState: 'new' | 'existing';
  checkType: CheckType;
  onTestSuccess: (data: AdHocCheckResponse) => void;
}

export function useCheckForm({ check, checkType, checkState, onTestSuccess }: UseCheckFormProps) {
  const [submittingToApi, setSubmittingToApi] = useState(false);
  const navigate = useNavigate();
  const { updateCheck, createCheck, error } = useCUDChecks({ eventInfo: { checkType } });
  const testButtonRef = useRef<HTMLButtonElement>(null);
  const { mutate: testCheck, isPending, error: testError } = useTestCheck({ eventInfo: { checkType } });

  const navigateToCheckDashboard = useCallback(
    (result: Check) => {
      const { frequency } = result;
      const additionalDuration = getAdditionalDuration(frequency, 20);
      const duration = formatDuration(additionalDuration, true);

      navigate(
        `${generateRoutePath(AppRoutes.CheckDashboard, {
          id: result.id!,
        })}?from=now$2B${DEFAULT_FROM_TIME}&to=now%2B${duration}`
      );
    },
    [navigate]
  );
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

  const mutateCheck = useCallback(
    async (newCheck: Check, alerts?: CheckAlertFormRecord) => {
      setSubmittingToApi(true);
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
        // it gets handled correctly by the the generic hooks and we have tests to prove that
        // this isn't strictly necessary but jest complains about this...
      } finally {
        setSubmittingToApi(false);
      }
    },
    [check?.id, check?.tenantId, createCheck, updateCheck, handleAlerts, navigateToCheckDashboard]
  );

  const handleValid = useCallback(
    (checkValues: CheckFormValues, event: BaseSyntheticEvent | undefined) => {
      // react-hook-form doesn't let us provide SubmitEvent to BaseSyntheticEvent
      const submitter = (event?.nativeEvent as SubmitEvent).submitter;
      const toSubmit = toPayload(checkValues);

      if (submitter === testButtonRef.current) {
        return testCheck(toSubmit, {
          onSuccess: (data) => {
            trackAdhocCreated({ checkType, checkState });
            onTestSuccess(data);
          },
        });
      }

      mutateCheck(toSubmit, alertsEnabled ? checkValues?.alerts : undefined);
    },
    [mutateCheck, onTestSuccess, testCheck, alertsEnabled, checkType, checkState]
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

export function useCheckFormDefaultValues(check?: Check) {
  const checkType = useFormCheckType(check);
  const checkWithFallback = check || fallbackCheckMap[checkType];

  return useMemo(() => {
    return toFormValues(checkWithFallback, checkType);
  }, [checkType, checkWithFallback]);
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
