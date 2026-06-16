import React, { createContext, useContext } from 'react';

import { Check } from 'types';
import {
  CheckFolderStatus,
  CheckPermissions,
} from 'data/folderPermissions';
import { useCheckFolderAccess } from 'hooks/useCheckFolderAccess';

interface CheckFolderAccessContextValue {
  visibleChecks: Check[];
  getPermissions: (check: Pick<Check, 'folderUid'>) => CheckPermissions;
  getFolderStatus: (check: Pick<Check, 'folderUid'>) => CheckFolderStatus;
}

const CheckFolderAccessContext = createContext<CheckFolderAccessContextValue | null>(null);

function useCheckFolderAccessContext() {
  const context = useContext(CheckFolderAccessContext);
  if (!context) {
    throw new Error('useCheckFolderAccessContext must be used within a CheckFolderAccessProvider');
  }
  return context;
}

/**
 * Provider that computes folder access internally from a list of checks.
 */
export function CheckFolderAccessProvider({ checks, children }: { checks: Check[]; children: React.ReactNode }) {
  const value = useCheckFolderAccess(checks);
  return <CheckFolderAccessContext.Provider value={value}>{children}</CheckFolderAccessContext.Provider>;
}

/**
 * Provider that accepts a pre-computed folder access result.
 * Use when the parent already called useCheckFolderAccess and needs
 * both the result (for visibleChecks) and to share it with descendants.
 */
export function CheckFolderAccessValueProvider({
  value,
  children,
}: {
  value: CheckFolderAccessContextValue;
  children: React.ReactNode;
}) {
  return <CheckFolderAccessContext.Provider value={value}>{children}</CheckFolderAccessContext.Provider>;
}

export function useVisibleChecks() {
  return useCheckFolderAccessContext().visibleChecks;
}

export function useCheckPermissions(check: Pick<Check, 'folderUid'>): CheckPermissions {
  return useCheckFolderAccessContext().getPermissions(check);
}

export function useCheckFolderStatus(check: Pick<Check, 'folderUid'>): CheckFolderStatus {
  return useCheckFolderAccessContext().getFolderStatus(check);
}

export function useBulkCheckPermissions(checks: Array<Pick<Check, 'folderUid'>>) {
  const { getPermissions } = useCheckFolderAccessContext();
  return {
    canWriteAll: checks.every((check) => getPermissions(check).canWrite),
    canDeleteAll: checks.every((check) => getPermissions(check).canDelete),
  };
}
