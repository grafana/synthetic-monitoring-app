import React, { createContext, PropsWithChildren, useContext } from 'react';
import { AppPluginMeta } from '@grafana/data';

import type { GlobalSettings } from 'types';

interface VerifiedMeta extends Omit<AppPluginMeta<GlobalSettings>, 'jsonData'> {
  jsonData: GlobalSettings;
}

type MetaContextValue = {
  meta: VerifiedMeta;
} | null;

export const MetaContext = createContext<MetaContextValue>(null);

interface MetaContextProviderProps extends PropsWithChildren {
  meta: AppPluginMeta<GlobalSettings>;
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
function verifyMeta(meta: AppPluginMeta<GlobalSettings>): VerifiedMeta {
  return meta as VerifiedMeta;
}
