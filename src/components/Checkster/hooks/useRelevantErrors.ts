import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { isEqual } from 'lodash';

import { getFlattenErrors } from '../utils/form';
import { useLiveErrors } from './useLiveErrors';

export function useRelevantErrors() {
  const {
    formState: { errors },
  } = useFormContext();
  const liveErrors = useLiveErrors();

  const [relevantErrors, setRelevantErrors] = useState<string[]>([]);

  useEffect(() => {
    const flatErrors = getFlattenErrors(errors);
    setRelevantErrors((prevState) => {
      const newState = flatErrors.filter((errorField) => liveErrors.includes(errorField));
      if (!isEqual(prevState, newState)) {
        return newState;
      }

      return prevState;
    });
  }, [liveErrors, errors]);

  return relevantErrors;
}
