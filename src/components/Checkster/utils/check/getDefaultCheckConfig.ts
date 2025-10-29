import { CheckType } from 'types';

import { DEFAULT_CHECK_CONFIG, DEFAULT_CHECK_CONFIG_MAP, DEFAULT_CHECK_TYPE } from '../../constants';

export function getDefaultCheckConfig(checkType: CheckType = DEFAULT_CHECK_TYPE) {
  return DEFAULT_CHECK_CONFIG_MAP[checkType] ?? DEFAULT_CHECK_CONFIG;
}
