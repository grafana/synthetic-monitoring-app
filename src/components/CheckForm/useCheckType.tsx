import { useLocation } from 'react-router-dom';

import { CheckType } from 'types';
import { useCheckTypeOptions } from 'hooks/useCheckTypeOptions';

export function useFormCheckType() {
  const options = useCheckTypeOptions();
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const checkType = (searchParams.get('checkType') as CheckType) || options[0].value;

  return checkType;
}
