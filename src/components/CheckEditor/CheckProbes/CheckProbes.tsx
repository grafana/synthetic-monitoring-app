import React, { useMemo, useState } from 'react';
import { Field, Stack } from '@grafana/ui';

import { ProbeWithMetadata } from 'types';
import { filterProbes } from 'components/CheckEditor/CheckProbes/CheckProbes.utils';
import { SearchFilter } from 'components/SearchFilter';

import { PrivateProbesAlert } from './PrivateProbesAlert';
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

export const PROBES_FILTER_ID = 'check-probes-filter';

export function CheckProbes({ probes, availableProbes, onChange, error, disabled }: CheckProbesProps) {
  const [filterText, setFilterText] = useState('');

  const filteredProbes = useMemo(() => filterProbes(availableProbes, filterText), [availableProbes, filterText]);
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
  const showEmptyState = filteredProbes.length === 0;

  return (
    <div>
      <Field
        label="Probe locations"
        description="Select one, multiple, or all probes where this target will be checked from. Deprecated probes can be removed, but they cannot be added."
        invalid={!!error}
        error={error}
        htmlFor={PROBES_FILTER_ID}
        disabled={disabled}
      >
        <div>
          <SearchFilter
            onSearch={setFilterText}
            id={PROBES_FILTER_ID}
            value={filterText}
            showEmptyState={showEmptyState}
            emptyText="There are no probes matching your criteria."
            placeholder="Find a probe by city, country, region or provider"
            data-form-name="probes"
          />
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
                    disabled={disabled}
                  />
                ))}
            </Stack>

            {privateProbes.length > 0 && (
              <ProbesList
                title="Private probes"
                probes={privateProbes}
                selectedProbes={probes}
                onSelectionChange={onChange}
                disabled={disabled}
              />
            )}
          </Stack>
        </div>
      </Field>
      {showPrivateProbesDiscovery && <PrivateProbesAlert />}
    </div>
  );
}
