import { useLocation, useParams } from 'react-router-dom';

import { Check, CheckFormPageParams, CheckType } from 'types';
import { getCheckType } from 'utils';
import { useCheckTypeOptions } from 'hooks/useCheckTypeOptions';

export function useFormCheckType(existingCheck?: Check) {
  const { checkTypeGroup } = useParams<CheckFormPageParams>();
  const options = useCheckTypeOptions();

  const fallback = options.filter((option) => option.group === checkTypeGroup);
  const { search } = useLocation();

  if (existingCheck) {
    return getCheckType(existingCheck.settings);
  }

  const searchParams = new URLSearchParams(search);
  const checkType = (searchParams.get('checkType') as CheckType) || fallback[0].value;

  return checkType;
}
