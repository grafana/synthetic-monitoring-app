import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { isEqual } from 'lodash';

import { useChecksterContext } from '../contexts/ChecksterContext';
import { getAllErrorFields } from '../utils/form';

export function useInvalidFields(ifErrors = true) {
  const [invalidFields, setInvalidFields] = useState<string[] | undefined>(undefined);
  const { getValues, formState } = useFormContext();
  const {
    formNavigation: { errors },
    schema,
  } = useChecksterContext();

  const hasFormStateErrors = !ifErrors || (errors !== undefined && errors.length > 0);

  useEffect(() => {
    if (hasFormStateErrors) {
      const values = getValues();
      const currentErrors = getAllErrorFields(schema, values);
      setInvalidFields((prevState) => {
        if (!isEqual(prevState, currentErrors)) {
          if (currentErrors.length > 0) {
            return currentErrors;
          }
          return undefined;
        }
        return prevState;
      });
    }
  }, [formState, hasFormStateErrors, errors, getValues, schema]);

  return invalidFields;
}
