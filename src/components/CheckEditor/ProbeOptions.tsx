import React from 'react';
import { FieldErrors } from 'react-hook-form';

import { CheckFormValues, CheckType, ProbeWithMetadata } from 'types';
import { useProbesWithMetadata } from 'data/useProbes';
import { Frequency } from 'components/CheckEditor/FormComponents/Frequency';

import { CheckProbes } from './CheckProbes/CheckProbes';

interface ProbeOptionsProps {
  checkType: CheckType;
  disabled?: boolean;
  errors?: FieldErrors<CheckFormValues>['probes'];
  onlyProbes?: boolean; // TODO: Remove when CheckEditor v1 is removed
  onChange: (probes: number[]) => void;
  selectedProbes: number[];
}

export const ProbeOptions = ({
  checkType,
  disabled,
  errors,
  onlyProbes,
  onChange,
  selectedProbes,
}: ProbeOptionsProps) => {
  const { data: probes = [] } = useProbesWithMetadata();

  return (
    <>
      <CheckProbes
        probes={selectedProbes}
        availableProbes={getAvailableProbes(probes, checkType)}
        disabled={disabled}
        invalid={Boolean(errors)}
        error={errors?.message}
        onChange={onChange}
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
