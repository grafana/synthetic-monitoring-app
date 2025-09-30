import React from 'react';
import { useFormContext } from 'react-hook-form';

import { CheckFormValues } from 'types';

import { useChecksterContext } from '../../../../contexts/ChecksterContext';
import { Frequency } from './Frequency';

// This is just a wrapper around Frequency to get the check type from context
// TODO: refactor Frequency to use context directly and remove this wrapper
export function GenericFrequencyField() {
  const {
    checkMeta: { type },
  } = useChecksterContext();
  const {
    formState: { disabled },
  } = useFormContext<CheckFormValues>();

  return <Frequency checkType={type} disabled={disabled} />;
}
