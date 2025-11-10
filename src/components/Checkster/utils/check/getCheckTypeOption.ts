import { CheckType } from 'types';

import { CHECK_TYPE_OPTION_MAP, DEFAULT_CHECK_TYPE } from '../../constants';

export function getCheckTypeOption(checkType?: CheckType) {
  const fallback = CHECK_TYPE_OPTION_MAP[DEFAULT_CHECK_TYPE];
  if (typeof checkType !== 'string') {
    return fallback;
  }

  return CHECK_TYPE_OPTION_MAP[checkType ?? DEFAULT_CHECK_TYPE] ?? CHECK_TYPE_OPTION_MAP[DEFAULT_CHECK_TYPE];
}
