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

function verifyMeta(meta: AppPluginMeta<GlobalSettings>): VerifiedMeta {
  // if (!meta.jsonData) {
  //   console.log(meta);
  //   throw new Error('verifyMeta: meta.jsonData is required');
  // }

  // if (!meta.jsonData.stackId) {
  //   console.log(meta);
  //   throw new Error('verifyMeta: meta.jsonData.stackId is required');
  // }

  return meta as VerifiedMeta;
}
