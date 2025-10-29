import React from 'react';
import { useFormContext } from 'react-hook-form';

import { CheckFormValues } from 'types';
import { Frequency } from 'components/CheckEditor/FormComponents/Frequency';

import { useChecksterContext } from '../../../../contexts/ChecksterContext';

// This is just a wrapper around Frequency to get the check type from context
export function GenericFrequencyField() {
  const { checkType } = useChecksterContext();
  const {
    formState: { disabled },
  } = useFormContext<CheckFormValues>();

  return <Frequency checkType={checkType} disabled={disabled} />;
}
