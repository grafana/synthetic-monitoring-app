import { useCallback } from 'react';

import { CheckFormFieldPath } from '../types';

import { useChecksterContext } from '../contexts/ChecksterContext';
import { checkFormFieldPath } from '../utils/form';

interface CheckFormFieldPathCreator {
  (path: string): CheckFormFieldPath;
}

export function useCheckFormFieldPath(path: string): CheckFormFieldPath;
export function useCheckFormFieldPath(): CheckFormFieldPathCreator;
export function useCheckFormFieldPath(path?: string): CheckFormFieldPath | CheckFormFieldPathCreator {
  const {
    checkMeta: { type },
  } = useChecksterContext();

  const result = path ? checkFormFieldPath(path, type) : undefined;

  const creator: CheckFormFieldPathCreator = useCallback(
    (path: string) => {
      return checkFormFieldPath(path, type) as CheckFormFieldPath;
    },
    [type]
  );

  return path !== undefined ? ((result ?? '') as CheckFormFieldPath) : creator;
}
