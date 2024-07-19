import React, { createContext, PropsWithChildren, useContext } from 'react';

interface ContextProps {
  canViewSM: boolean;
  canViewLogs: boolean;
  canViewMetrics: boolean;
  canEditSM: boolean;
  canAdminSM: boolean;
}

const PermissionsContext = createContext<ContextProps>({
  canViewSM: false,
  canViewLogs: false,
  canViewMetrics: false,
  canEditSM: false,
  canAdminSM: false,
});

export const PermissionsContextProvider = ({ children }: PropsWithChildren) => {
  const canViewSM = true;
  const canViewLogs = true;
  const canViewMetrics = true;

  const canEditSM = true;
  const canAdminSM = true;

  return (
    <PermissionsContext.Provider value={{ canViewSM, canViewLogs, canViewMetrics, canEditSM, canAdminSM }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export function usePermissions() {
  const context = useContext(PermissionsContext);

  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsContextProvider');
  }

  return context;
}
