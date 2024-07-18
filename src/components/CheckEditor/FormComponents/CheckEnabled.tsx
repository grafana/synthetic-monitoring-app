import React from 'react';
import { useFormContext } from 'react-hook-form';

import { CheckFormValues } from 'types';
import { useCheckFormContext } from 'components/CheckForm/CheckFormContext/CheckFormContext';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';

export const CheckEnabled = () => {
  const { register } = useFormContext<CheckFormValues>();
  const { isFormDisabled } = useCheckFormContext();

  return (
    <HorizontalCheckboxField
      disabled={isFormDisabled}
      data-fs-element="Check enabled checkbox"
      id="check-form-enabled"
      label="Enabled"
      description="If a check is enabled, metrics and logs are published to your Grafana Cloud stack."
      {...register('enabled')}
    />
  );
};
