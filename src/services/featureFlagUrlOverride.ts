import { urlUtil } from '@grafana/data';
import { isArray } from 'lodash';

// Kept apart from featureFlags.ts so callers such as FeatureFlagContext (reached from the
// datasource bundle) don't pull the OpenFeature SDK in with it.

// Repeat the key for several flags: `?features=a&features=b`
export function isFeatureEnabledThroughUrl(...names: string[]) {
  const featuresParam = urlUtil.getUrlSearchParams()['features'];

  if (!isArray(featuresParam)) {
    return false;
  }

  const urlFeatures = featuresParam as string[];

  return names.some((name) => urlFeatures.includes(name));
}
