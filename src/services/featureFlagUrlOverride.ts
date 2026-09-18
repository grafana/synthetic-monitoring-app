import { urlUtil } from '@grafana/data';
import { castArray } from 'lodash';

export function isFeatureEnabledThroughUrl(...names: string[]) {
  const featuresParam = urlUtil.getUrlSearchParams()['features'];
  const urlFeatures = castArray(featuresParam).filter((value): value is string => typeof value === 'string');

  return names.some((name) => urlFeatures.includes(name));
}
