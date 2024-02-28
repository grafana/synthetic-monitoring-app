import React from 'react';
import { Select } from '@grafana/ui';
import { uniq } from 'lodash';

import { Probe } from 'types';
import { useProbes } from 'data/useProbes';

type ProbeRegionsSelectProps = {
  id: string;
  onChange: (value: string | undefined | null) => void;
  invalid?: boolean;
  value?: string | null;
};

export const ProbeRegionsSelect = ({ id, invalid, onChange, value }: ProbeRegionsSelectProps) => {
  const { data, isLoading } = useProbes();
  const regions = getRegions(data, value);
  const options = regions.map((region) => ({ label: region, value: region }));

  return (
    <Select
      inputId={id}
      options={options}
      value={value || null}
      allowCustomValue
      onChange={(value) => {
        if (value === null) {
          return onChange(null);
        }
        onChange(value?.value);
      }}
      onCreateOption={(value) => {
        onChange(value);
      }}
      isLoading={isLoading}
      disabled={isLoading}
      placeholder="Add or select a region"
      isClearable
      invalid={invalid}
    />
  );
};

function getRegions(probes?: Probe[], value?: string | null) {
  const val = value === null ? undefined : value;

  if (!probes) {
    return [val];
  }

  return uniq([...probes.map((probe) => probe.region), val]);
}
