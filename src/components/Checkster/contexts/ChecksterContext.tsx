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
import { zodResolver } from '@hookform/resolvers/zod';
import { isEqual } from 'lodash';
import { addRefinements } from 'schemas/forms/BaseCheckSchema';
import { ZodSchema } from 'zod';

import { FormNavigationState, FormSectionName } from '../types';
import { Check, CheckFormValues, CheckType } from 'types';
import { getCheckType } from 'utils';
import { useDOMId } from 'hooks/useDOMId';

import {
  ASSISTED_FORM_MERGE_FIELDS,
  CheckFormMergeMethod,
  DEFAULT_CHECK_FORM_MERGE_METHOD,
  DEFAULT_CHECK_TYPE,
  FORM_CHECK_TYPE_SCHEMA_MAP,
  K6_CHECK_TYPES,
} from '../constants';
import { useFormNavigationState } from '../hooks/useFormNavigationState';
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
  setIsSubmitting: Dispatch<SetStateAction<boolean>>;
  changeCheckType: (checkType: CheckType) => void;
  schema: ZodSchema;
  checkType: CheckType;
  isNew: boolean;
  isK6Check: boolean;
}

export const ChecksterContext = createContext<ChecksterContextValue | null>(null);

export function useChecksterContext() {
  const context = useContext(ChecksterContext);
  if (!context) {
    throw new Error('useChecksterContext must be used within an ChecksterProvider');
  }

  return context;
}

interface ChecksterProviderProps extends PropsWithChildren {
  checkOrCheckType?: Check | CheckType;
  initialSection?: FormSectionName;
}

interface StashedValues {
  root: Omit<CheckFormValues, 'settings'>;
  settings: Record<string, unknown> | undefined;
}

function useFormValuesMeta(checkType: CheckType, check?: Check) {
  return useMemo(
    () => ({
      defaultFormValues: check ? toFormValues(check) : getDefaultFormValues(checkType),
      schema: addRefinements(FORM_CHECK_TYPE_SCHEMA_MAP[checkType]),
    }),
    [checkType, check]
  );
}

export function ChecksterProvider({
  children,
  checkOrCheckType,
  initialSection,
}: PropsWithChildren<ChecksterProviderProps>) {
  const check = isCheck(checkOrCheckType) ? checkOrCheckType : undefined;
  const [checkType, setCheckType] = useState<CheckType>(
    isCheck(checkOrCheckType) ? getCheckType(checkOrCheckType.settings) : checkOrCheckType ?? DEFAULT_CHECK_TYPE
  );
  const formId = useDOMId();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>();
  const isNew = !check || !check.id;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { schema, defaultFormValues } = useFormValuesMeta(checkType, check);

  const [stashedValues, setStashedValues] = useState<Partial<StashedValues>>({});

  const values = useMemo(() => {
    if (DEFAULT_CHECK_FORM_MERGE_METHOD === CheckFormMergeMethod.None) {
      return undefined; // Will persist dirty values
    }
    const checkType = defaultFormValues.checkType;
    const { root, settings, ...dumpedFormValues } = stashedValues;
    if (DEFAULT_CHECK_FORM_MERGE_METHOD === CheckFormMergeMethod.AssistedForm) {
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
    }

    if (DEFAULT_CHECK_FORM_MERGE_METHOD === CheckFormMergeMethod.Legacy) {
      const job = root?.job;
      // @ts-expect-error We know what we're doing, right? // TODO: revisit typings
      const settings = checkType in dumpedFormValues ? dumpedFormValues[checkType] : undefined;

      if (settings) {
        return {
          ...settings,
          job,
        };
      }

      if (job) {
        return {
          ...defaultFormValues,
          job,
        };
      }

      return defaultFormValues;
    }

    return undefined;
  }, [defaultFormValues, stashedValues]);

  // Form stuff
  const formMethods = useForm<CheckFormValues>({
    defaultValues: defaultFormValues,
    resolver: zodResolver(schema),
    mode: 'onChange', // onBlur is a bit fiddly
    reValidateMode: 'onChange',
    disabled: isLoading || isSubmitting,
  });

  useEffect(() => {
    if (!isNew && check) {
      // Trigger form validation on existing checks
      formMethods.trigger();
    }
  }, [check, formMethods, isNew]);

  useEffect(() => {
    if (isCheck(check)) {
      const type = getCheckType(check.settings);
      setCheckType(type);
    }
  }, [check, formMethods, isNew]);

  const formMethodRef = useRef(formMethods);

  useEffect(() => {
    if (DEFAULT_CHECK_FORM_MERGE_METHOD === CheckFormMergeMethod.None) {
      formMethods.reset(defaultFormValues);
      return;
    }

    if ([CheckFormMergeMethod.Form, CheckFormMergeMethod.AssistedForm].includes(DEFAULT_CHECK_FORM_MERGE_METHOD)) {
      // This works as long as the user doesnt change type two times in a row
      formMethods.reset(defaultFormValues, {
        keepDirty: true,
        keepDirtyValues: true,
        keepSubmitCount: true,
      });

      if (DEFAULT_CHECK_FORM_MERGE_METHOD === CheckFormMergeMethod.AssistedForm) {
        ASSISTED_FORM_MERGE_FIELDS.forEach((field) => {
          values &&
            formMethodRef.current.setValue(field, values[field], {
              shouldDirty: true,
              shouldTouch: true,
            });
        });

        const touchedFields = flattenObjectKeys(formMethodRef.current.formState.touchedFields as any);
        if (touchedFields.length > 0) {
          formMethods.trigger(touchedFields as any);
        }
      }
    }

    if (DEFAULT_CHECK_FORM_MERGE_METHOD === CheckFormMergeMethod.Legacy) {
      if (values !== defaultFormValues) {
        formMethodRef.current.reset(values);
      }
    }
  }, [check, checkType, defaultFormValues, formMethodRef, formMethods, isNew, values]);

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
    },
    [formMethods, isNew, stashCurrentValues]
  );

  const value = useMemo(() => {
    return {
      formId,
      isLoading,
      setIsLoading,
      error,
      setError,
      check,
      formNavigation,
      setIsSubmitting,
      changeCheckType,
      checkType,
      schema,
      isNew,
      isK6Check: K6_CHECK_TYPES.includes(checkType),
      stashCheckTypeFormValues: stashCurrentValues,
    };
  }, [formId, isLoading, error, check, formNavigation, changeCheckType, checkType, schema, isNew, stashCurrentValues]);

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
