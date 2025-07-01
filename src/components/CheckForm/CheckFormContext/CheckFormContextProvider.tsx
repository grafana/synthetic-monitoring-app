import React, { PropsWithChildren, useEffect, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Check, CheckFormValues } from 'types';

import { useCheckFormMeta } from '../CheckForm.hooks';
import { CheckFormContext } from './CheckFormContext';

interface CheckFormContextProviderProps extends PropsWithChildren {
  check?: Check;
  disabled?: boolean;
}

export function CheckFormContextProvider({ check, children, disabled = false }: CheckFormContextProviderProps) {
  const checkFormMeta = useCheckFormMeta(check);

  const methods = useForm<CheckFormValues>({
    disabled: disabled || checkFormMeta.isDisabled,
    defaultValues: checkFormMeta.defaultFormValues,
    shouldFocusError: false, // we manage focus manually
    resolver: zodResolver(checkFormMeta.schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    if (check) {
      // Reset form values when check changes
      methods.reset(checkFormMeta.defaultFormValues);
    }
  }, [check, checkFormMeta.defaultFormValues, methods]);

  const value = useMemo(() => {
    return checkFormMeta;
  }, [checkFormMeta]);

  return (
    <CheckFormContext.Provider value={value}>
      <FormProvider {...methods}>{children}</FormProvider>
    </CheckFormContext.Provider>
  );
}
