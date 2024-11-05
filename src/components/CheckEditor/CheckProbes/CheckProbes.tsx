import React, { forwardRef, useMemo, useState } from 'react';
import { Field, Stack } from '@grafana/ui';

import { Probe } from 'types';

import { PrivateProbesAlert } from './PrivateProbesAlert';
import { ProbesFilter } from './ProbesFilter';
import { ProbesList } from './ProbesList';

interface CheckProbesProps {
  probes: number[];
  availableProbes: Probe[];
  disabled?: boolean;
  onChange: (probes: number[]) => void;
  onBlur?: () => void;
  invalid?: boolean;
  error?: string;
}
export const CheckProbes = forwardRef(({ probes, availableProbes, onChange, error }: CheckProbesProps) => {
  const [filteredProbes, setFilteredProbes] = useState<Probe[]>(availableProbes);

  const publicProbes = useMemo(() => filteredProbes.filter((probe) => probe.public), [filteredProbes]);
  const privateProbes = useMemo(() => filteredProbes.filter((probe) => !probe.public), [filteredProbes]);

  const groupedByRegion = useMemo(
    () =>
      publicProbes.reduce((acc: Record<string, Probe[]>, curr: Probe) => {
        const region = curr.region;
        if (!acc[region]) {
          acc[region] = [];
        }
        acc[region].push(curr);
        return acc;
      }, {}),
    [publicProbes]
  );

  const showPrivateProbesDiscovery = privateProbes.length === 0 && filteredProbes.length === availableProbes.length;

  return (
    <div>
      <Field
        label="Probe locations"
        description="Select one, multiple, or all probes where this target will be checked from. Deprecated probes can be removed, but they cannot be added."
        invalid={!!error}
        error={error}
      >
        <div>
          <ProbesFilter probes={availableProbes} onSearch={setFilteredProbes} />
          <Stack wrap="wrap">
            {privateProbes.length > 0 && (
              <ProbesList
                title="Private probes"
                probes={privateProbes}
                selectedProbes={probes}
                onSelectionChange={onChange}
              />
            )}

            {Object.entries(groupedByRegion).map(([region, allProbes]) => (
              <ProbesList
                key={region}
                title={region}
                probes={allProbes}
                selectedProbes={probes}
                onSelectionChange={onChange}
              />
            ))}
          </Stack>
        </div>
      </Field>
      {showPrivateProbesDiscovery && <PrivateProbesAlert />}
    </div>
  );
});

CheckProbes.displayName = 'CheckProbes';
