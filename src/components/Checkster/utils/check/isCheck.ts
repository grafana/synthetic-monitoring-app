// Super basic isCheck validation, since we only check if the settings object includes the checkType key
import { Check, CheckType } from 'types';

export function isCheck(check: unknown): check is Check {
  const checkTypes = Object.values(CheckType);
  if (!check || typeof check !== 'object' || !('settings' in check)) {
    return false;
  }

  const [settingsType] = Object.keys((check as Check).settings ?? {});
  return checkTypes.includes(settingsType as CheckType);
}
