import React, { createContext, PropsWithChildren, useContext } from 'react';

import { CheckHealthModel } from './checkHealth.types';

const CheckHealthContext = createContext<CheckHealthModel | null>(null);

export function CheckHealthProvider({
  children,
  value,
}: PropsWithChildren<{
  value: CheckHealthModel;
}>) {
  return <CheckHealthContext.Provider value={value}>{children}</CheckHealthContext.Provider>;
}

export function useCheckHealthOptional(): CheckHealthModel | null {
  return useContext(CheckHealthContext);
}

export function useCheckHealth(): CheckHealthModel {
  const value = useCheckHealthOptional();

  if (!value) {
    throw new Error('useCheckHealth must be used inside a CheckHealthProvider');
  }

  return value;
}
