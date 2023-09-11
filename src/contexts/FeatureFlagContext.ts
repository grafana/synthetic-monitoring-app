import { createContext } from 'react';
import { FeatureToggles, urlUtil } from '@grafana/data';
import { config } from '@grafana/runtime';
import { FeatureName } from 'types';
import { isArray } from 'lodash';

export interface FeatureFlagContextValue {
  featureToggles: FeatureToggles;
  isFeatureEnabled: (name: FeatureName) => boolean;
}

export function isFeatureEnabled(name: FeatureName) {
  // Override traceroute feature flag until we're sure we don't need it anymore
  const featuresParam = urlUtil.getUrlSearchParams()['features'];
  let isEnabledThroughQueryParam = false;
  if (isArray(featuresParam)) {
    const stringParams = featuresParam as string[];
    isEnabledThroughQueryParam = stringParams.includes(name);
  }
  //@ts-ignore
  return Boolean(config.featureToggles[name]) || isEnabledThroughQueryParam;
}

export function getFeatureContextValues() {
  return {
    featureToggles: config.featureToggles,
    isFeatureEnabled,
  };
}

export const FeatureFlagContext = createContext<FeatureFlagContextValue>(getFeatureContextValues());
