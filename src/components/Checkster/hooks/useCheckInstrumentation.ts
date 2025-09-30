import { useMemo } from 'react';

import { CheckType, CheckTypeGroup } from '../../../types';

export function useCheckInstrumentation(group?: CheckTypeGroup, type?: CheckType) {
  return useMemo(() => ({ group: group ?? undefined, type: type ?? undefined }), [group, type]);
}
