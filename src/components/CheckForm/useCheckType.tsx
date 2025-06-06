import { useParams } from 'react-router-dom-v5-compat';

import { Check, CheckFormPageParams, CheckType } from 'types';
import { getCheckType } from 'utils';
import { CHECK_TYPE_OPTIONS, useCheckTypeOptions } from 'hooks/useCheckTypeOptions';
import { useURLSearchParams } from 'hooks/useURLSearchParams';

export function useFormCheckType(existingCheck?: Check) {
  const { checkTypeGroup } = useParams<CheckFormPageParams>();
  const options = useCheckTypeOptions();
  const fallback = options.filter((option) => option.group === checkTypeGroup);
  const urlSearchParams = useURLSearchParams();

  if (existingCheck) {
    return getCheckType(existingCheck.settings);
  }

  const checkType = urlSearchParams.get('checkType') as CheckType;

  return checkType || fallback[0]?.value || options[0].value;
}

export function useFormCheckTypeGroup(check?: Check) {
  const { checkTypeGroup } = useParams<CheckFormPageParams>();

  if (check) {
    const checkType = getCheckType(check.settings);
    return CHECK_TYPE_OPTIONS.find(({ value }) => value === checkType)?.group;
  }

  return checkTypeGroup;
}
