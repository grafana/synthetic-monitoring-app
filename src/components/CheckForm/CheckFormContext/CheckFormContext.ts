import { createContext, useContext } from 'react';

import { useCheckFormMeta } from '../CheckForm.hooks';

type CheckFormContextValue = ReturnType<typeof useCheckFormMeta> & {
  initialSection: string;
  showAdhocTestModal: boolean;
  setShowAdhocTestModal: (show: boolean) => void;
  adhocTestData?: any;
  setAdhocTestData: (data: any) => void;
  setAdhocTestError: (error: Error | null) => void;
  adhocTestError: Error | null;
};

export const CheckFormContext = createContext<CheckFormContextValue | null>(null);

export function useCheckFormContext() {
  const context = useContext(CheckFormContext);
  if (!context) {
    throw new Error('useCheckFormContext must be used within a CheckFormContextProvider');
  }

  return context;
}
