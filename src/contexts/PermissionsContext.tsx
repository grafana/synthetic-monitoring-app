import React, { createContext, PropsWithChildren } from 'react';

interface ContextProps {
  canViewSM: boolean;
  canViewLogs: boolean;
  canViewMetrics: boolean;
  canEditSM: boolean;
  canEditLogs: boolean;
  canEditMetrics: boolean;
}

const PermissionsContext = createContext<ContextProps>({
  canViewSM: false,
  canViewLogs: false,
  canViewMetrics: false,
  canEditSM: false,
  canEditLogs: false,
  canEditMetrics: false,
});

export const PermissionsContextProvider = ({ children }: PropsWithChildren) => {
  const canViewSM = true;
  const canViewLogs = true;
  const canViewMetrics = true;

  const canEditSM = true;
  const canEditLogs = true;
  const canEditMetrics = true;

  return (
    <PermissionsContext.Provider
      value={{ canViewSM, canViewLogs, canViewMetrics, canEditSM, canEditLogs, canEditMetrics }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};
