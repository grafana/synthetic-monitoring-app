import { Check, CheckType, CheckTypeGroup } from 'types';

import { CHECK_TYPE_OPTION_MAP } from '../constants';
import { getCheckType } from '../utils/check';

export function useCheckTypes(check?: Check): [CheckType, CheckTypeGroup] {
  const type = getCheckType(check);
  const group = CHECK_TYPE_OPTION_MAP[type].group;

  return [type, group];
}
