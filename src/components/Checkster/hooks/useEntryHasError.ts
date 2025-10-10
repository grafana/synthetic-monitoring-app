import { useMemo } from 'react';

import { useChecksterContext } from '../contexts/ChecksterContext';
import { getHasSectionError } from '../utils/navigation';

type EntryFieldPath = 'settings.multihttp.entries';
export function useEntryHasError(field: EntryFieldPath, index: number) {
  const {
    formNavigation: { errors },
  } = useChecksterContext();

  return useMemo(() => {
    if (!errors) {
      return false;
    }
    return getHasSectionError([`${field}.${index}`], errors);
  }, [errors, field, index]);
}
