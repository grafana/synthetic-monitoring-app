import React, {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { CheckInstrumentation, FormNavigationState } from '../types';
import { Check, CheckFormValues } from 'types';

import { useDOMId } from '../../../hooks/useDOMId';
import { DEFAULT_CHECK_CONFIG } from '../constants';
import { CheckMeta, useCheckMeta } from '../hooks/useCheckMeta';
import { useDebugHook } from '../hooks/useDebugHook';
import { useFormNavigationState } from '../hooks/useFormNavigationState';
import { createInstrumentedCheck, isCheck } from '../utils/check';

interface ChecksterContextValue {
  formId: string;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  error?: Error;
  setError: Dispatch<SetStateAction<Error | undefined>>;
  setCheck: Dispatch<SetStateAction<Check | CheckInstrumentation | undefined>>;
  check: Check | undefined;
  checkMeta: CheckMeta;
  formNavigation: FormNavigationState;
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
  check?: Check | CheckInstrumentation;
}

export function ChecksterProvider({ children, check: _checkViaProps = DEFAULT_CHECK_CONFIG }: ChecksterProviderProps) {
  const formId = useDOMId();
  useDebugHook('formId', formId);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  useDebugHook('isLoading', isLoading);

  const [_check, _setCheck] = useState<Check | CheckInstrumentation | undefined>(_checkViaProps);
  useDebugHook('_check', _check);

  const [check, setCheck] = useState<Check>(DEFAULT_CHECK_CONFIG);
  useDebugHook('check', check);

  const checkMeta = useCheckMeta(check);

  const [error, setError] = useState<Error | undefined>();
  useDebugHook('error', error);

  const formNavigation = useFormNavigationState(checkMeta.type);

  useEffect(() => {
    if (!_check) {
      return;
    }

    if (isCheck(_check)) {
      console.log('[Effect] settings check', _check);
      setCheck(_check);
      return;
    }

    // Create a new check
    if (isCheckInstrumentation(_check)) {
      console.log('[Effect] instrumenting check', _check);
      setCheck(createInstrumentedCheck(_check));
      return;
    }

    console.log('[Effect] check changed, no action', _check);
  }, [_check]);

  // Form stuff
  const formMethods = useForm<CheckFormValues>({
    defaultValues: checkMeta.defaultFormValues,
    resolver: zodResolver(checkMeta.schema),
    mode: 'onChange', // onBlur is a bit fiddly
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    if (check) {
      // Reset form values when check changes
      formMethods.reset(checkMeta.defaultFormValues);
    }
  }, [check, checkMeta.defaultFormValues, formMethods]);

  const value = useMemo(() => {
    return { formId, isLoading, setIsLoading, error, setError, setCheck: _setCheck, check, checkMeta, formNavigation };
  }, [error, isLoading, _setCheck, check, checkMeta, formId, formNavigation]);

  if (!check) {
    return null; // or a loading spinner, or some placeholder
  }

  return (
    <ChecksterContext.Provider value={value}>
      <FormProvider {...formMethods}>{children}</FormProvider>
    </ChecksterContext.Provider>
  );
}

// This component checks if there is already a ChecksterContext provider in the tree.
// If there is, it simply renders the children.
// If there isn't, it wraps the children with a ChecksterProvider.
export function InternalConditionalProvider({ children }: PropsWithChildren) {
  const context = useContext(ChecksterContext);
  if (context) {
    return <>{children}</>;
  }

  return <ChecksterProvider>{children}</ChecksterProvider>;
}

// utils
function isCheckInstrumentation(subject: unknown): subject is CheckInstrumentation {
  return !!subject && typeof subject === 'object' && ('type' in subject || 'group' in subject);
}
