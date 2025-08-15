import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { AdHocCheckResponse } from '../../../datasource/responses.types';
import { Check, CheckFormValues } from 'types';

import { useCheckFormMeta } from '../CheckForm.hooks';
import { FORM_SECTION_STEPS, SectionName } from '../FormLayout/FormLayout.constants';
import { FormLayoutContextProvider } from '../FormLayout/FormLayoutContext';
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

  const [showAdhocTestModal, setShowAdhocTestModal] = useState(false);
  const [adhocTestData, setAdhocTestData] = useState<AdHocCheckResponse>();
  const [adhocTestError, setAdhocTestError] = useState<Error | null>(null);

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
    return {
      ...checkFormMeta,
      initialSection,
      showAdhocTestModal,
      setShowAdhocTestModal,
      adhocTestData,
      setAdhocTestData,
      adhocTestError,
      setAdhocTestError,
    };
  }, [adhocTestData, adhocTestError, checkFormMeta, initialSection, showAdhocTestModal]);

  return (
    <CheckFormContext.Provider value={value}>
      <FormProvider {...methods}>
        <FormLayoutContextProvider>{children}</FormLayoutContextProvider>
      </FormProvider>
    </CheckFormContext.Provider>
  );
}
