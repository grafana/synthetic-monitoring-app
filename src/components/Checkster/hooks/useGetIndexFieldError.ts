import { useMemo } from 'react';

import { FormFieldMatch } from '../types';

import { useChecksterContext } from '../contexts/ChecksterContext';
import { getHasSectionError } from '../utils/navigation';

export function useGetIndexFieldError(indexFields: Array<FormFieldMatch[] | undefined>): boolean[] {
  const {
    formNavigation: { errors },
  } = useChecksterContext();

  return useMemo(() => {
    if (!indexFields) {
      return [];
    }

    if (!errors) {
      return new Array(indexFields.length).fill(false);
    }

    return indexFields.reduce<boolean[]>((acc, fields) => {
      if (fields && getHasSectionError(fields, errors)) {
        acc.push(true);
      } else {
        acc.push(false);
      }
      return acc;
    }, []);
  }, [errors, indexFields]);
}
