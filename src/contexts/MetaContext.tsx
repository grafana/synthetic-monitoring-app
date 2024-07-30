import React, { createContext, PropsWithChildren, useContext } from 'react';
import { AppPluginMeta } from '@grafana/data';

import type { ProvisioningJsonData } from 'types';

interface VerifiedMeta extends Omit<AppPluginMeta<ProvisioningJsonData>, 'jsonData'> {
  jsonData: ProvisioningJsonData;
}

type MetaContextValue = {
  meta: VerifiedMeta;
} | null;

export const MetaContext = createContext<MetaContextValue>(null);

interface MetaContextProviderProps extends PropsWithChildren {
  meta: AppPluginMeta<ProvisioningJsonData>;
}

export const MetaContextProvider = ({ children, meta }: MetaContextProviderProps) => {
  const verifiedMeta = verifyMeta(meta);

  return <MetaContext.Provider value={{ meta: verifiedMeta }}>{children}</MetaContext.Provider>;
};

export function useMetaContext() {
  const context = useContext(MetaContext);

  if (!context) {
    throw new Error('useMetaContext must be used within a MetaContextProvider');
  }

  return context;
}

// todo: work out what to do if this is not a verified meta
function verifyMeta(meta: AppPluginMeta<ProvisioningJsonData>): VerifiedMeta {
  return meta as VerifiedMeta;
}
