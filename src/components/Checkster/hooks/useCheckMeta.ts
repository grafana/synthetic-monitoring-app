import { useMemo } from 'react';
import { ZodType } from 'zod';

import { Check, CheckFormValues, CheckType, CheckTypeGroup } from 'types';

import { addRefinements } from '../../../schemas/forms/BaseCheckSchema';
import { FORM_CHECK_TYPE_SCHEMA_MAP, K6_CHECK_TYPES } from '../constants';
import { useCheckTypes } from './useCheckTypes';
import { useFormDefaultValues } from './useFormDefaultValues';

export interface CheckMeta {
  type: CheckType;
  group: CheckTypeGroup;
  schema: ZodType;
  defaultFormValues: CheckFormValues;
  isNew: boolean;
  isK6Check: boolean;
}

export function useCheckMeta(check: Check): CheckMeta {
  const [type, group] = useCheckTypes(check);
  const defaultFormValues = useFormDefaultValues(check);
  const isNew = !check.id;

  // Add refinements to get a complete schema
  const schema = useMemo(() => {
    // TODO: consider adding the refinements to the schema map
    return addRefinements(FORM_CHECK_TYPE_SCHEMA_MAP[type]);
  }, [type]);

  return useMemo(() => {
    return { type, group, schema, defaultFormValues, isNew, isK6Check: K6_CHECK_TYPES.includes(type) };
  }, [type, group, schema, defaultFormValues, isNew]);
}
