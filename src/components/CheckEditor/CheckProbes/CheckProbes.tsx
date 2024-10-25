import React, { forwardRef } from 'react';
import { Field, Stack } from '@grafana/ui';

import { Probe } from 'types';

import { PrivateProbesAlert } from './PrivateProbesAlert';
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
export const CheckProbes = forwardRef(
  ({ probes, availableProbes, disabled, onChange, onBlur, invalid, error }: CheckProbesProps, ref) => {
    const publicProbes = availableProbes.filter((probe) => probe.public);
    const privateProbes = availableProbes.filter((probe) => !probe.public);

    const groupedByRegion = publicProbes.reduce((acc: Record<string, Probe[]>, curr: Probe) => {
      const region = curr.region;
      if (!acc[region]) {
        acc[region] = [];
      }
      acc[region].push(curr);
      return acc;
    }, {});

    return (
      <div>
        <Field
          label="Probe locations"
          description="Select one, multiple, or all probes where this target will be checked from. Deprecated probes can be removed, but they cannot be added."
          invalid={!!error}
          error={error}
        >
          <div>
            <Stack alignItems="flex-start">
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
        {privateProbes.length === 0 && <PrivateProbesAlert />}
      </div>
    );
  }
);

CheckProbes.displayName = 'CheckProbes';
