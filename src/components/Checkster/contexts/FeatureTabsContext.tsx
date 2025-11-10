import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { FeatureTabConfig, FeatureTabLabel } from '../types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';

import { FEATURE_TABS } from '../feature/config';
import { useChecksterContext } from './ChecksterContext';

type EmptyFeatureTabConfig = ['', null, []];

interface FeatureTabsContextValue {
  setActive: (label: FeatureTabLabel) => void;
  tabs: FeatureTabConfig[];
  activeTab: FeatureTabConfig | EmptyFeatureTabConfig;
}

export const FeatureTabsContext = createContext<FeatureTabsContextValue | undefined>(undefined);

// In case nothing adds up
const panicTab: EmptyFeatureTabConfig = ['', null, []];

export function FeatureTabsContextProvider({ children }: PropsWithChildren) {
  const [activeLabel, setActiveLabel] = useState<string>('');

  const { checkType } = useChecksterContext();

  const tabs = useMemo(() => {
    return FEATURE_TABS.filter(([, , checkCompatibility, featureName]) => {
      if (featureName && !isFeatureEnabled(featureName)) {
        return false;
      }

      return checkCompatibility.length === 0 || checkCompatibility.includes(checkType);
    });
  }, [checkType]);

  const activeTab = useMemo<FeatureTabConfig | typeof panicTab>(() => {
    const tab = tabs.find(([label]) => label === activeLabel);
    if (!tab) {
      const fallback = tabs[0] ?? panicTab;
      setActiveLabel(fallback[0]);
      return fallback;
    }
    return tab;
  }, [activeLabel, tabs]);

  useEffect(() => {
    if (!tabs.some(([label]) => label === activeLabel)) {
      const fallback = tabs[0] ?? panicTab;
      setActiveLabel(fallback[0]);
    }
  }, [tabs, activeLabel]);

  const value = useMemo(() => {
    return {
      tabs,
      setActive: setActiveLabel,
      activeTab,
    };
  }, [activeTab, tabs]);

  return <FeatureTabsContext.Provider value={value}>{children}</FeatureTabsContext.Provider>;
}

export function useFeatureTabsContext() {
  const context = useContext(FeatureTabsContext);
  if (!context) {
    throw new Error('useFeatureTabsContext must be used within an FeatureTabsContext provider.');
  }

  return context;
}
