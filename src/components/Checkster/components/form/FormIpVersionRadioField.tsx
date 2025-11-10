import React from 'react';

import { CheckFormFieldPath } from '../../types';

import { IP_VERSION_OPTIONS } from '../../constants';
import { GenericRadioButtonGroupField } from './generic/GenericRadioButtonGroupField';

interface FormIpVersionRadioFieldProps {
  field: CheckFormFieldPath;
  label?: string;
  description?: string;
}
export function FormIpVersionRadioField({ field, label = 'IP version', description }: FormIpVersionRadioFieldProps) {
  return (
    <GenericRadioButtonGroupField field={field} label={label} description={description} options={IP_VERSION_OPTIONS} />
  );
}
