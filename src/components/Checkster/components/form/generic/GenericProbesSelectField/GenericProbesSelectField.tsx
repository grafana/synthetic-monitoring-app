import React, { useCallback } from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { CheckFormValues } from 'types';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';

import { useChecksterContext } from '../../../../contexts/ChecksterContext';

export function GenericProbesSelectField() {
  const { checkType } = useChecksterContext();
  const {
    control,
    formState: { disabled, errors },
  } = useFormContext<CheckFormValues>();
  const { field: probesField } = useController({ control, name: 'probes' });
  const handleProbesChange = useCallback(
    (probes: number[]) => {
      probesField.onChange(probes);
    },
    [probesField]
  );

  return (
    <ProbeOptions
      checkType={checkType}
      disabled={disabled}
      errors={errors.probes}
      onlyProbes
      selectedProbes={probesField.value}
      onChange={handleProbesChange}
    />
  );
}
