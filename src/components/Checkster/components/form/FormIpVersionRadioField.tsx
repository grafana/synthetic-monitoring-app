import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Field, RadioButtonGroup } from '@grafana/ui';

import { CheckFormFieldPath } from '../../types';

import { IP_VERSION_OPTIONS } from '../../constants';

interface FormIpVersionRadioFieldProps {
  field: CheckFormFieldPath;
}

// TODO: Could be generic RadioField component
export function FormIpVersionRadioField({ field }: FormIpVersionRadioFieldProps) {
  const { setValue, getValues } = useFormContext();

  const value = getValues(field);

  const handleOnChange = (value: string) => {
    setValue(field, value, { shouldValidate: true }); // `shouldValidate` ensures that new value is returned in getValues immediately
  };

  return (
    <Field label="IP Version" description="The IP protocol of the HTTP request">
      <RadioButtonGroup options={IP_VERSION_OPTIONS} onChange={handleOnChange} value={value} />
    </Field>
  );
}
