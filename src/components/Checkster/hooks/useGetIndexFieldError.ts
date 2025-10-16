import { useMemo } from 'react';

import { FormFieldMatch } from '../types';

import { useChecksterContext } from '../contexts/ChecksterContext';
import { getHasSectionError } from '../utils/navigation';
import { useSilentErrors } from './useSilentErrors';

export function useGetIndexFieldError(indexFields: Array<FormFieldMatch[] | undefined>): boolean[] {
  const {
    formNavigation: { errors: formErrors },
  } = useChecksterContext();

  const liveErrors = useSilentErrors();

  const errors = useMemo(() => {
    return formErrors?.filter((field) => liveErrors.some((liveError) => liveError.startsWith(field)));
  }, [formErrors, liveErrors]);

  return useMemo(() => {
    if (!indexFields) {
      return [];
    }

    if (!errors || errors.length === 0) {
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
