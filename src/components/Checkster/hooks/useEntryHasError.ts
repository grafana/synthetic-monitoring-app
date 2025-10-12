import { useMemo } from 'react';

import { getHasSectionError } from '../utils/navigation';
import { useRelevantErrors } from './useRelevantErrors';

type EntryFieldPath = 'settings.multihttp.entries';
export function useEntryHasError(field: EntryFieldPath, index: number) {
  const errors = useRelevantErrors();

  return useMemo(() => {
    if (!errors || errors.length === 0) {
      return false;
    }
    return getHasSectionError([`${field}.${index}`], errors);
  }, [errors, field, index]);
}
