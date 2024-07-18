import React, { createContext, ReactNode, useContext, useMemo } from 'react';

import { Request } from './CheckFormContext.types';
import { RequestFields } from 'components/CheckEditor/CheckEditor.types';

import { useTestRequests } from './useTestRequests';

type ContextProps = {
  isFormDisabled: boolean;
  supportingContent: {
    requests: Request[];
    addRequest: (fields: RequestFields) => void;
  };
};

export const CheckFormContext = createContext<ContextProps>({
  isFormDisabled: false,
  supportingContent: {
    requests: [],
    addRequest: (fields: RequestFields) => {},
  },
});

interface CheckFormContextProviderProps {
  children: ReactNode;
  disabled: boolean;
}

export const CheckFormContextProvider = ({ children, disabled }: CheckFormContextProviderProps) => {
  const { requests, addRequest } = useTestRequests();

  const value = useMemo(() => {
    return {
      isFormDisabled: disabled,
      supportingContent: {
        requests,
        addRequest,
      },
    };
  }, [disabled, requests, addRequest]);

  return <CheckFormContext.Provider value={value}>{children}</CheckFormContext.Provider>;
};

export function useCheckFormContext() {
  const context = useContext(CheckFormContext);

  if (!context) {
    throw new Error('useCheckFormContext must be used within a CheckFormContextProvider');
  }

  return context;
}
