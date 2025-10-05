import { useMemo } from 'react';

import { Check, CheckFormValues, CheckType, CheckTypeGroup } from 'types';

import { FORM_CHECK_TYPE_SCHEMA_MAP, K6_CHECK_TYPES } from '../constants';
import { useCheckTypes } from './useCheckTypes';
import { useFormDefaultValues } from './useFormDefaultValues';

export interface CheckMeta {
  type: CheckType;
  group: CheckTypeGroup;
  schema: (typeof FORM_CHECK_TYPE_SCHEMA_MAP)[CheckType];
  defaultFormValues: CheckFormValues;
  isNew: boolean;
  isK6Check: boolean;
}

export function useCheckMeta(check: Check): CheckMeta {
  const [type, group] = useCheckTypes(check);
  const schema = FORM_CHECK_TYPE_SCHEMA_MAP[type];
  const defaultFormValues = useFormDefaultValues(check);
  const isNew = !check.id;

  return useMemo(() => {
    return { type, group, schema, defaultFormValues, isNew, isK6Check: K6_CHECK_TYPES.includes(type) };
  }, [type, group, schema, defaultFormValues, isNew]);
}
