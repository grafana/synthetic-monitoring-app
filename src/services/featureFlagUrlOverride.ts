import { urlUtil } from '@grafana/data';
import { isArray } from 'lodash';

export function isFeatureEnabledThroughUrl(...names: string[]) {
  const featuresParam = urlUtil.getUrlSearchParams()['features'];

  if (!isArray(featuresParam)) {
    return false;
  }

  const urlFeatures = featuresParam as string[];

  return names.some((name) => urlFeatures.includes(name));
}
