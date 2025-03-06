import React, { createContext, PropsWithChildren, useContext } from 'react';
import { useParams } from 'react-router-dom-v5-compat';

import { Check, CheckPageParams } from 'types';
import { useCheck } from 'data/useChecks';

type CheckDrilldownContextValue = {
  check: Check;
  isLoading: boolean;
  isError: boolean;
} | null;

const CheckDrilldownContext = createContext<CheckDrilldownContextValue>(null);

export const CheckDrilldownProvider = ({ children }: PropsWithChildren) => {
  const { id } = useParams<CheckPageParams>();
  const { data = null, isLoading, isError } = useCheck(Number(id));

  if (!data) {
    return null;
  }

  return (
    <CheckDrilldownContext.Provider value={{ check: data, isLoading, isError }}>
      {children}
    </CheckDrilldownContext.Provider>
  );
};

export function useCheckDrilldown() {
  const context = useContext(CheckDrilldownContext);

  if (!context) {
    throw new Error('useCheckDrilldown must be used within a CheckDrilldownContext');
  }

  return context;
}
