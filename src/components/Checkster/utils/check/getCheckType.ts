import { Check, CheckType } from 'types';

import { DEFAULT_CHECK_TYPE } from '../../constants';

// Returns the CheckType of a Check, or DEFAULT_CHECK_TYPE check is undefined (or invalid)
export function getCheckType(check?: Check) {
  if (!check) {
    return DEFAULT_CHECK_TYPE;
  }

  const [checkType = DEFAULT_CHECK_TYPE] = Object.keys(check.settings ?? {});

  return checkType as CheckType;
}
