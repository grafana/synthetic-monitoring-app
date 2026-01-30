import React from 'react';
import { Combobox } from '@grafana/ui';
import { uniq } from 'lodash';

import { Probe } from 'types';
import { useProbes } from 'data/useProbes';

type ProbeRegionsSelectProps = {
  disabled?: boolean;
  id: string;
  onChange: (value: string | undefined | null) => void;
  invalid?: boolean;
  value?: string | null;
};

export const ProbeRegionsSelect = ({ disabled, id, invalid, onChange, value }: ProbeRegionsSelectProps) => {
  const { data, isLoading } = useProbes();
  const regions = getRegions(data, value);
  const options = regions.filter((region) => region !== undefined).map((region) => ({ label: region, value: region }));

  return (
    <Combobox
      id={id}
      options={options}
      value={value || null}
      createCustomValue
      onChange={(value) => {
        if (value === null) {
          return onChange(null);
        }
        onChange(value?.value);
      }}
      disabled={isLoading || disabled}
      placeholder="Add or select a region"
      isClearable
      invalid={invalid}
    />
  );
};

function getRegions(probes?: Probe[], value?: string | null) {
  const val = value === null ? undefined : value;

  if (!probes) {
    return [val].filter(Boolean);
  }

  return uniq([...probes.map((probe) => probe.region), val].filter(Boolean));
}
