import { createContext } from 'react';
import { FeatureToggles } from '@grafana/data';
import { config } from '@grafana/runtime';
import { isFeatureEnabledThroughUrl } from 'services/featureFlagUrlOverride';

import { FeatureName } from 'types';

export interface FeatureFlagContextValue {
  featureToggles: FeatureToggles;
  isFeatureEnabled: (name: FeatureName) => boolean;
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
