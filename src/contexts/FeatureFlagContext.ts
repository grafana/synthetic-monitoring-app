import { createContext } from 'react';
import { FeatureToggles, urlUtil } from '@grafana/data';
import { config } from '@grafana/runtime';
import { isArray } from 'lodash';

import { FeatureName } from 'types';

export interface FeatureFlagContextValue {
  featureToggles: FeatureToggles;
  isFeatureEnabled: (name: FeatureName) => boolean;
}

// `?features=a&features=b`
export function isFeatureEnabledThroughUrl(...names: string[]) {
  const featuresParam = urlUtil.getUrlSearchParams()['features'];

  if (!isArray(featuresParam)) {
    return false;
  }

  const urlFeatures = featuresParam as string[];

  return names.some((name) => urlFeatures.includes(name));
}

export function isFeatureEnabled(name: FeatureName) {
  //@ts-ignore
  return Boolean(config.featureToggles[name]) || isFeatureEnabledThroughUrl(name);
}

export function getFeatureContextValues() {
  return {
    featureToggles: config.featureToggles,
    isFeatureEnabled,
  };
}

export const FeatureFlagContext = createContext<FeatureFlagContextValue>(getFeatureContextValues());
