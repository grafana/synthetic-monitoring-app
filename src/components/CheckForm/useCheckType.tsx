import { useParams } from 'react-router-dom-v5-compat';

import { Check, CheckFormPageParams, CheckType, CheckTypeGroup } from 'types';
import { getCheckType } from 'utils';
import { CHECK_TYPE_OPTIONS, useCheckTypeOptions } from 'hooks/useCheckTypeOptions';
import { useURLSearchParams } from 'hooks/useURLSearchParams';

function isValidCheckType(checkType: unknown): checkType is CheckType {
  return Object.values(CheckType).includes(checkType as CheckType);
}

export function useFormCheckType(existingCheck?: Check) {
  const { checkTypeGroup } = useParams<CheckFormPageParams>();
  const options = useCheckTypeOptions();
  const fallback = options.filter((option) => option.group === checkTypeGroup);
  const urlSearchParams = useURLSearchParams();

  if (existingCheck) {
    return getCheckType(existingCheck.settings);
  }

  const checkType = urlSearchParams.get('checkType');

  // Prevent the app from crashing if checkType is not valid (since it comes from search params).
  if (!isValidCheckType(checkType)) {
    return fallback[0]?.value || options[0].value;
  }

  return checkType;
}

export function useFormCheckTypeGroup(check?: Check) {
  const { checkTypeGroup } = useParams<CheckFormPageParams>();

  if (check) {
    const checkType = getCheckType(check.settings);
    return CHECK_TYPE_OPTIONS.find(({ value }) => value === checkType)?.group;
  }

  if (checkTypeGroup && Object.values(CheckTypeGroup).includes(checkTypeGroup)) {
    return checkTypeGroup;
  }

  return CheckTypeGroup.ApiTest;
}
