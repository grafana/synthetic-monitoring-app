import React, { useMemo, useState } from 'react';
import { Field, Stack } from '@grafana/ui';

import { ProbeWithMetadata } from 'types';

import { PrivateProbesAlert } from './PrivateProbesAlert';
import { PROBES_FILTER_ID, ProbesFilter } from './ProbesFilter';
import { ProbesList } from './ProbesList';

interface CheckProbesProps {
  probes: number[];
  availableProbes: ProbeWithMetadata[];
  disabled?: boolean;
  onChange: (probes: number[]) => void;
  onBlur?: () => void;
  invalid?: boolean;
  error?: string;
}
export function CheckProbes({ probes, availableProbes, onChange, error }: CheckProbesProps) {
  const [filteredProbes, setFilteredProbes] = useState<ProbeWithMetadata[]>(availableProbes);

  const publicProbes = useMemo(() => filteredProbes.filter((probe) => probe.public), [filteredProbes]);
  const privateProbes = useMemo(() => filteredProbes.filter((probe) => !probe.public), [filteredProbes]);

  const groupedByRegion = useMemo(
    () =>
      publicProbes.reduce((acc: Record<string, ProbeWithMetadata[]>, curr: ProbeWithMetadata) => {
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
        invalid={Boolean(error)}
        error={error}
        htmlFor={PROBES_FILTER_ID}
      >
        <div>
          <ProbesFilter probes={availableProbes} onSearch={setFilteredProbes} />
          <Stack wrap="wrap">
            <Stack wrap="nowrap">
              {Object.entries(groupedByRegion)
                .sort(([regionA], [regionB]) => regionA.localeCompare(regionB))
                .map(([region, allProbes]) => (
                  <ProbesList
                    key={region}
                    title={region}
                    probes={allProbes}
                    selectedProbes={probes}
                    onSelectionChange={onChange}
                  />
                ))}
            </Stack>

            {privateProbes.length > 0 && (
              <ProbesList
                title="Private probes"
                probes={privateProbes}
                selectedProbes={probes}
                onSelectionChange={onChange}
              />
            )}
          </Stack>
        </div>
      </Field>
      {showPrivateProbesDiscovery && <PrivateProbesAlert />}
    </div>
  );
}
