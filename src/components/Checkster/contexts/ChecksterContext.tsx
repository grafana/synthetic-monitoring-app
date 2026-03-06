import React, {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { isEqual, set } from 'lodash';
import { addRefinements } from 'schemas/forms/BaseCheckSchema';
import { createCheckSchema } from 'schemas/forms/utils/createCheckSchema';
import { ZodType } from 'zod';

import { FormNavigationState, FormSectionName } from '../types';
import { Check, CheckFormValues, CheckType, Label, ProbeWithMetadata } from 'types';
import { getCheckType } from 'utils';
import { useProbesWithMetadata } from 'data/useProbes';
import { useDOMId } from 'hooks/useDOMId';
import { useSvalinnScript } from 'hooks/useSvalinnScript';
import { useURLSearchParams } from 'hooks/useURLSearchParams';

import { ASSISTED_FORM_MERGE_FIELDS, DEFAULT_CHECK_TYPE, K6_CHECK_TYPES } from '../constants';
import { useFormNavigationState } from '../hooks/useFormNavigationState';
import { useProbeCompatibilityKey } from '../hooks/useProbeCompattibilityKey';
import { getDefaultFormValues, toFormValues } from '../utils/adaptors';
import { isCheck } from '../utils/check';
import { flattenObjectKeys } from '../utils/form';

interface ChecksterContextValue {
  formId: string;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  error?: Error;
  setError: Dispatch<SetStateAction<Error | undefined>>;
  check: Check | undefined;
  formNavigation: FormNavigationState;
  changeCheckType: (checkType: CheckType) => void;
  schema: ZodType<CheckFormValues>;
  checkType: CheckType;
  isNew: boolean;
  isK6Check: boolean;
  canChangeCheckType: boolean;
  hiddenLabels: Label[];
  svalinnIsLoading: boolean;
  svalinnError: string | null;
}

export const ChecksterContext = createContext<ChecksterContextValue | null>(null);

export function useChecksterContext() {
  const context = useContext(ChecksterContext);
  if (!context) {
    throw new Error('useChecksterContext must be used within an ChecksterProvider');
  }

  return context;
}

export interface ChecksterProviderProps extends PropsWithChildren {
  initialSection?: FormSectionName;
  onCheckTypeChange?(checkType: CheckType): void;
  disabled?: boolean;
  check?: Check;
  checkType?: CheckType;
  isDuplicate?: boolean;
}

interface StashedValues {
  root: Omit<CheckFormValues, 'settings'>;
  settings: Record<string, unknown> | undefined;
}

function useFormValuesMeta(
  checkType: CheckType,
  check: Check | undefined,
  probesWithMetadata: ProbeWithMetadata[],
  svalinnScript: string | null
) {
  const probeCompatibilityKey = useProbeCompatibilityKey(probesWithMetadata);
  const params = useURLSearchParams();
  const svalinnId = params.get('svalinn-id');
  const svalinnName = params.get('svalinn-name');
  const incidentsCovered = params.get('svalinn_incidents_covered');

  const hiddenLabels = useMemo<Label[]>(() => {
    if (!svalinnId || check) {
      return [];
    }
    const labels: Label[] = [{ name: 'shield', value: 'svalinn' }];
    if (incidentsCovered) {
      labels.push({ name: 'svalinn_incidents_covered', value: incidentsCovered });
    }
    return labels;
  }, [svalinnId, incidentsCovered, check]);

  return useMemo(() => {
    const schema = createCheckSchema(checkType, probesWithMetadata);
    const refinedSchema = addRefinements<CheckFormValues>(schema);

    const defaultFormValues = check ? toFormValues(check) : getDefaultFormValues(checkType);

    if (!check && svalinnName) {
      defaultFormValues.job = svalinnName;
    }

    if (!check && svalinnScript !== null) {
      set(defaultFormValues, `settings.${checkType}.script`, svalinnScript);
    }

    return { defaultFormValues, schema: refinedSchema, hiddenLabels };
    // Use probeCompatibilityKey instead of probesWithMetadata array reference
    // This ensures schema only recreates when probe compatibility actually changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkType, check, probeCompatibilityKey, svalinnName, svalinnScript, hiddenLabels]);
}

export function ChecksterProvider({
  children,
  check: externalCheck,
  checkType: externalCheckType,
  initialSection,
  onCheckTypeChange,
  disabled = false,
  isDuplicate = false,
}: PropsWithChildren<ChecksterProviderProps>) {
  const check = isCheck(externalCheck) ? externalCheck : undefined;
  const { data: probesWithMetadata = [] } = useProbesWithMetadata();

  const [checkType, setCheckType] = useState<CheckType>(
    isCheck(externalCheck) ? getCheckType(externalCheck.settings) : (externalCheckType ?? DEFAULT_CHECK_TYPE)
  );

  const formId = useDOMId();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>();
  const isNew = !check || !check.id;

  const { script: svalinnScript, isLoading: svalinnIsLoading, error: svalinnError } = useSvalinnScript();
  const { schema, defaultFormValues, hiddenLabels } = useFormValuesMeta(checkType, check, probesWithMetadata, svalinnScript);

  const [stashedValues, setStashedValues] = useState<Partial<StashedValues>>({});

  const values = useMemo(() => {
    const { root } = stashedValues;
    return ASSISTED_FORM_MERGE_FIELDS.reduce((acc, assistedKey) => {
      if (
        root &&
        assistedKey in root &&
        assistedKey in defaultFormValues &&
        !isEqual(root[assistedKey], defaultFormValues[assistedKey])
      ) {
        return {
          ...acc,
          [assistedKey]: root[assistedKey],
        };
      }

      return acc;
    }, defaultFormValues);
  }, [defaultFormValues, stashedValues]);

  // Form stuff
  const formMethods = useForm<CheckFormValues>({
    defaultValues: defaultFormValues,
    resolver: standardSchemaResolver(schema),
    mode: 'onChange', // onBlur is a bit fiddly
    reValidateMode: 'onChange',
    disabled: disabled || isLoading, // || isSubmitting,
    shouldFocusError: true,
  });

  useEffect(() => {
    if (!isNew && check) {
      // Trigger form validation on existing checks
      formMethods.trigger();
    }
  }, [check, formMethods, isNew]);

  const formMethodRef = useRef(formMethods);

  useEffect(() => {
    formMethods.reset(defaultFormValues, {
      keepIsValid: true,
      keepDirty: true,
      keepDirtyValues: true,
      keepTouched: true,
      keepSubmitCount: true,
      keepErrors: true,
    });

    ASSISTED_FORM_MERGE_FIELDS.forEach((field) => {
      values && formMethodRef.current.setValue(field, values[field]);
    });

    const dirtyFields = flattenObjectKeys(formMethodRef.current.formState.dirtyFields as any);
    if (dirtyFields.length > 0) {
      formMethods.trigger(dirtyFields as any);
    }
  }, [defaultFormValues, formMethodRef, formMethods, values]);

  const formNavigation = useFormNavigationState(checkType, formMethods, initialSection);

  useEffect(() => {
    if (!isNew && !formNavigation.isStepsComplete) {
      formNavigation.completeAllSteps();
    }
  }, [formNavigation, isNew]);

  const stashCurrentValues = useCallback((formValues: CheckFormValues) => {
    const { settings, ...rootProps } = formValues;

    setStashedValues((prevState) => {
      return {
        ...prevState,
        root: {
          ...prevState?.root,
          ...rootProps,
        },
        settings: {
          ...prevState.settings,
          // @ts-expect-error TODO: work the types a little
          ...settings[rootProps.checkType],
        },
        [formValues.checkType]: formValues,
      };
    });
  }, []);

  const changeCheckType = useCallback(
    (checkType: CheckType) => {
      if (!isNew) {
        return;
      }
      stashCurrentValues(formMethods.getValues());
      setCheckType(checkType);
      onCheckTypeChange?.(checkType);
    },
    [formMethods, isNew, onCheckTypeChange, stashCurrentValues]
  );

  const canChangeCheckType = isNew || isDuplicate;

  useEffect(() => {
    if (isDuplicate) {
      formMethods.setValue('job', `${check?.job} (Copy)`, { shouldDirty: true });
      formNavigation.completeAllSteps();
    }
    // only do this on mount so it doesn't trigger when the check is updated
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: ChecksterContextValue = useMemo(() => {
    return {
      formId,
      isLoading,
      setIsLoading,
      error,
      setError,
      check,
      formNavigation,
      changeCheckType,
      checkType,
      schema,
      isNew,
      canChangeCheckType,
      isK6Check: K6_CHECK_TYPES.includes(checkType),
      stashCheckTypeFormValues: stashCurrentValues,
      hiddenLabels,
      svalinnIsLoading,
      svalinnError,
    };
  }, [
    formId,
    isLoading,
    error,
    check,
    formNavigation,
    changeCheckType,
    checkType,
    schema,
    isNew,
    stashCurrentValues,
    canChangeCheckType,
    hiddenLabels,
    svalinnIsLoading,
    svalinnError,
  ]);

  return (
    <ChecksterContext.Provider value={value}>
      <FormProvider {...formMethods}>{children}</FormProvider>
    </ChecksterContext.Provider>
  );
}

// This component checks if there is already a ChecksterContext provider in the tree.
// If there is, it simply renders the children.
// If there isn't, it wraps the children with a ChecksterProvider.
export function InternalConditionalProvider({ children, ...props }: ChecksterProviderProps) {
  const context = useContext(ChecksterContext);
  if (context) {
    return <>{children}</>;
  }

  return <ChecksterProvider {...props}>{children}</ChecksterProvider>;
}
