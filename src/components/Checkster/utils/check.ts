import { CheckInstrumentation } from '../types';
import { Check, CheckType } from 'types';

import {
  CHECK_TYPE_GROUP_MAP,
  CHECK_TYPE_OPTION_MAP,
  DEFAULT_CHECK_CONFIG,
  DEFAULT_CHECK_CONFIG_MAP,
  DEFAULT_CHECK_TYPE,
} from '../constants';

// Returns true if the provided value is a Check
// Existing checks do not have to be checked against feature flags as they were already created
export function isCheck(check: unknown): check is Check {
  const checkTypes = Object.values(CheckType);
  if (!check || typeof check !== 'object' || !('settings' in check)) {
    return false;
  }

  const [settingsType] = Object.keys((check as Check).settings ?? {});
  return checkTypes.includes(settingsType as CheckType);
}

export function createInstrumentedCheck({ type, group }: CheckInstrumentation) {
  if (type) {
    return createCheck(type);
  }
  // Fallback to default check type for the group or default to DEFAULT_CHECK_TYPE
  const [defaultType] = group && CHECK_TYPE_GROUP_MAP[group] ? CHECK_TYPE_GROUP_MAP[group] : [DEFAULT_CHECK_TYPE];

  return createCheck(defaultType);
}

export function createCheck(checkType: CheckType = CheckType.HTTP) {
  return DEFAULT_CHECK_CONFIG_MAP[checkType] ?? DEFAULT_CHECK_CONFIG;
}

// Returns the CheckType of a Check, or DEFAULT_CHECK_TYPE check is undefined (or invalid)
export function getCheckType(check?: Check) {
  if (!check) {
    return DEFAULT_CHECK_TYPE;
  }

  const [checkType = DEFAULT_CHECK_TYPE] = Object.keys(check.settings ?? {});

  return checkType as CheckType;
}

export function getCheckTypeOption(checkType?: CheckType) {
  return CHECK_TYPE_OPTION_MAP[checkType ?? DEFAULT_CHECK_TYPE] ?? CHECK_TYPE_OPTION_MAP[DEFAULT_CHECK_TYPE];
}
