import React, { PropsWithChildren, useEffect, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';

import { Check, CheckFormValues } from 'types';

import { useCheckFormMeta } from '../CheckForm.hooks';
import { FORM_SECTION_STEPS, SectionName } from '../FormLayout/FormLayout.constants';
import { CheckFormContext } from './CheckFormContext';

interface CheckFormContextProviderProps extends PropsWithChildren {
  check?: Check;
  disabled?: boolean;
  initialSection?: SectionName;
}

export function CheckFormContextProvider({
  check,
  children,
  disabled = false,
  initialSection = FORM_SECTION_STEPS[0],
}: CheckFormContextProviderProps) {
  const checkFormMeta = useCheckFormMeta(check);
  const schema = checkFormMeta.schema;

  const methods = useForm<CheckFormValues>({
    disabled: disabled || checkFormMeta.isDisabled,
    defaultValues: checkFormMeta.defaultFormValues,
    shouldFocusError: false, // we manage focus manually
    resolver: standardSchemaResolver(schema),
  });

  useEffect(() => {
    if (check) {
      // Reset form values when check changes
      methods.reset(checkFormMeta.defaultFormValues);
    }
  }, [check, checkFormMeta.defaultFormValues, methods]);

  const value = useMemo(() => {
    return { ...checkFormMeta, initialSection };
  }, [checkFormMeta, initialSection]);

  return (
    <CheckFormContext.Provider value={value}>
      <FormProvider {...methods}>{children}</FormProvider>
    </CheckFormContext.Provider>
  );
}
