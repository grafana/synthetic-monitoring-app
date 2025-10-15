import React, { useCallback } from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { CheckFormValues, CheckType, ProbeWithMetadata } from 'types';
import { useProbesWithMetadata } from 'data/useProbes';
import { useRevalidateForm } from 'hooks/useRevalidateForm';
import { Frequency } from 'components/CheckEditor/FormComponents/Frequency';

import { CheckProbes } from './CheckProbes/CheckProbes';

interface ProbeOptionsProps {
  checkType: CheckType;
  onlyProbes?: boolean;
}

export const ProbeOptions = ({ checkType, onlyProbes }: ProbeOptionsProps) => {
  const { data: probes = [] } = useProbesWithMetadata();
  const {
    control,
    formState: { errors, disabled },
  } = useFormContext<CheckFormValues>();
  const revalidateForm = useRevalidateForm();
  const { field } = useController({ control, name: 'probes' });
  const { ref, ...fieldProps } = field; // ref is unused, this is to silence warnings

  const handleChange = useCallback(
    (probes: number[]) => {
      field.onChange(probes);
      revalidateForm();
    },
    [field, revalidateForm]
  );

  return (
    <>
      <CheckProbes
        {...fieldProps}
        probes={field.value}
        availableProbes={getAvailableProbes(probes, checkType)}
        disabled={disabled}
        invalid={Boolean(errors.probes)}
        error={errors.probes?.message}
        onChange={handleChange}
      />
      {!onlyProbes && <Frequency checkType={checkType} disabled={disabled} />}
    </>
  );
};

function getAvailableProbes(probes: ProbeWithMetadata[], checkType: CheckType) {
  if (checkType === CheckType.Scripted) {
    return probes.filter((probe) => !probe.capabilities.disableScriptedChecks);
  }

  if (checkType === CheckType.Browser) {
    return probes.filter((probe) => !probe.capabilities.disableBrowserChecks);
  }
  return probes;
}
