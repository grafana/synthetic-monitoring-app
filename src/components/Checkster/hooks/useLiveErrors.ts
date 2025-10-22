import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { isEqual } from 'lodash';

import { CheckFormValues } from '../../../types';

import { useChecksterContext } from '../contexts/ChecksterContext';
import { getAllErrorFields } from '../utils/form';

export function useLiveErrors() {
  const { schema } = useChecksterContext();
  const { watch, getValues } = useFormContext<CheckFormValues>();
  const values = watch();

  const [allErrors, setAllErrors] = useState<string[]>([]);

  useEffect(() => {
    // Wait for event loop, so that form state has time to update when switching check type
    const timeout = setTimeout(() => {
      const currentFieldErrors = getAllErrorFields(schema, getValues());
      setAllErrors((prevState) => {
        if (isEqual(prevState, currentFieldErrors)) {
          return prevState;
        }

        return currentFieldErrors;
      });
    });

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [getValues, schema, values]);

  return allErrors;
}
