import React from 'react';
import { useFormContext } from 'react-hook-form';

import { CheckFormValues } from 'types';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';

export const CheckEnabled = () => {
  const { register, formState } = useFormContext<CheckFormValues>();

  return (
    <HorizontalCheckboxField
      disabled={formState.disabled}
      data-fs-element="Check enabled checkbox"
      id="check-form-enabled"
      label="Enabled"
      description="If a check is enabled, metrics and logs are published to your Grafana Cloud stack."
      {...register('enabled')}
    />
  );
};
