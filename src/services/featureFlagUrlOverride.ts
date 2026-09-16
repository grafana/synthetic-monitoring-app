import { urlUtil } from '@grafana/data';
import { isArray } from 'lodash';

// `?features=a&features=b`. Kept out of featureFlags.ts so FeatureFlagContext, which the
// datasource bundle reaches, doesn't pull in the OpenFeature SDK.
export function isFeatureEnabledThroughUrl(...names: string[]) {
  const featuresParam = urlUtil.getUrlSearchParams()['features'];

  if (!isArray(featuresParam)) {
    return false;
  }

  const urlFeatures = featuresParam as string[];

  return names.some((name) => urlFeatures.includes(name));
}
