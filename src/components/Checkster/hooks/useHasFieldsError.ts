import { useMemo } from 'react';

import { FormFieldMatch } from '../types';

import { useChecksterContext } from '../contexts/ChecksterContext';
import { getHasSectionError } from '../utils/navigation';

export function useHasFieldsError(fields: FormFieldMatch[]) {
  const {
    formNavigation: { errors },
  } = useChecksterContext();

  return useMemo(() => {
    if (!errors || !fields) {
      return false;
    }

    return getHasSectionError(fields, errors);
  }, [errors, fields]);
}
