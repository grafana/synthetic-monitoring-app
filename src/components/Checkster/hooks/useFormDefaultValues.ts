import { useMemo } from 'react';

import { Check, CheckFormValues } from 'types';

import { toFormValues } from '../utils/adaptors';

export function useFormDefaultValues(check: Check): CheckFormValues {
  return useMemo(() => {
    return toFormValues(check);
  }, [check]);
}
