import React from 'react';
import { useFormContext } from 'react-hook-form';
import { RadioButtonGroup } from '@grafana/ui';

import { CheckFormFieldPath } from '../../types';

import { IP_VERSION_OPTIONS } from '../../constants';
import { StyledField } from '../ui/StyledField';

interface FormIpVersionRadioFieldProps {
  field: CheckFormFieldPath;
  label?: string;
  description?: string;
}

// TODO: Could be generic RadioField component
export function FormIpVersionRadioField({ field, label = 'IP Version', description }: FormIpVersionRadioFieldProps) {
  const { setValue, getValues } = useFormContext();

  const value = getValues(field);

  const handleOnChange = (value: string) => {
    setValue(field, value, { shouldValidate: true }); // `shouldValidate` ensures that new value is returned in getValues immediately
  };

  return (
    <StyledField label={label} description={description}>
      <RadioButtonGroup options={IP_VERSION_OPTIONS} onChange={handleOnChange} value={value} />
    </StyledField>
  );
}
