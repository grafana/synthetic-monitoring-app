import React, { createContext, ReactNode, useContext, useMemo } from 'react';

import { Request } from './CheckFormContext.types';
import { CheckFormValues } from 'types';
import { AdHocCheckResponse } from 'datasource/responses.types';
import { RequestFields } from 'components/CheckEditor/CheckEditor.types';

import { useTestRequests } from './useTestRequests';

type ContextProps = {
  isFormDisabled: boolean;
  supportingContent: {
    requests: Request[];
    addCheckTest: (checkFormValues: CheckFormValues, onTestSuccess?: (data: AdHocCheckResponse) => void) => void;
    addIndividualRequest: (
      fields: RequestFields,
      checkFormValues: CheckFormValues,
      onTestSuccess?: (data: AdHocCheckResponse) => void
    ) => void;
  };
} | null;

export const CheckFormContext = createContext<ContextProps>(null);

interface CheckFormContextProviderProps {
  children: ReactNode;
  disabled: boolean;
}

export const CheckFormContextProvider = ({ children, disabled }: CheckFormContextProviderProps) => {
  const { requests, addCheckTest, addIndividualRequest } = useTestRequests();

  const value = useMemo(() => {
    return {
      isFormDisabled: disabled,
      supportingContent: {
        requests,
        addCheckTest,
        addIndividualRequest,
      },
    };
  }, [disabled, requests, addCheckTest, addIndividualRequest]);

  return <CheckFormContext.Provider value={value}>{children}</CheckFormContext.Provider>;
};

export function useCheckFormContext() {
  const context = useContext(CheckFormContext);

  if (!context) {
    throw new Error('useCheckFormContext must be used within a CheckFormContextProvider');
  }

  return context;
}
