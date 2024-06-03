import { useLocation, useParams } from 'react-router-dom';

import { CheckFormPageParams, CheckType } from 'types';
import { useCheckTypeOptions } from 'hooks/useCheckTypeOptions';

export function useFormCheckType() {
  const { checkTypeGroup } = useParams<CheckFormPageParams>();
  const options = useCheckTypeOptions();

  const fallback = options.filter((option) => option.group === checkTypeGroup);
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const checkType = (searchParams.get('checkType') as CheckType) || fallback[0].value;

  return checkType;
}
