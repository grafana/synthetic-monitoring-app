import { createContext } from 'react';
import { FeatureToggles, urlUtil } from '@grafana/data';
import { config } from '@grafana/runtime';
import { FeatureName } from 'types';

interface FeatureFlagContextValue {
  featureToggles: FeatureToggles;
  isFeatureEnabled: (name: FeatureName) => boolean;
}

function isFeatureEnabled(name: FeatureName) {
  const isEnabledThroughQueryParam = urlUtil.getUrlSearchParams()['features']?.includes(name);
  // @ts-ignore
  // the type definitions in grafana core for feature toggles aren't quite right
  return Boolean(config.featureToggles[name]?.live) || isEnabledThroughQueryParam;
}

export function getFeatureContextValues() {
  return {
    featureToggles: config.featureToggles,
    isFeatureEnabled,
  };
}

export const FeatureFlagContext = createContext<FeatureFlagContextValue>(getFeatureContextValues());
