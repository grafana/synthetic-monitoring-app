import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Field, Input } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValuesTraceroute } from 'types';
import { Collapse } from 'components/Collapse';
import { LabelField } from 'components/LabelField';

import { HorizontalCheckboxField } from './HorizonalCheckboxField';

interface Props {
  isEditor: boolean;
}

export const TracerouteSettingsForm = ({ isEditor }: Props) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { register, formState } = useFormContext<CheckFormValuesTraceroute>();
  const { errors } = formState;
  const errorPath = errors?.settings?.traceroute;
  const maxHopsError = errorPath?.maxHops;
  const maxHopesErrorMessage = maxHopsError?.message;
  const maxUnknownHopsError = errorPath?.maxUnknownHops;
  const maxUnknownHopesErrorMessage = maxUnknownHopsError?.message;

  return (
    <Collapse label="Advanced options" onToggle={() => setShowAdvanced(!showAdvanced)} isOpen={showAdvanced}>
      <div
        className={css`
          max-width: 500px;
        `}
      >
        <LabelField<CheckFormValuesTraceroute> isEditor={isEditor} />
        <Field
          label="Max hops"
          description="Maximum TTL for the trace"
          disabled={!isEditor}
          invalid={Boolean(maxHopsError)}
          error={typeof maxHopesErrorMessage === 'string' && maxHopesErrorMessage}
        >
          <Input
            id="traceroute-settings-max-hops"
            {...register('settings.traceroute.maxHops', {
              min: { value: 0, message: `Must be greater than 0` },
              max: { value: 64, message: `Can be no more than 64` },
            })}
            min={0}
            type="number"
            disabled={!isEditor}
          />
        </Field>
        <Field
          label="Max unknown hops"
          description="Maximimum number of hosts to traverse that give no response"
          disabled={!isEditor}
          invalid={Boolean(maxUnknownHopsError)}
          error={typeof maxUnknownHopesErrorMessage === 'string' && maxUnknownHopesErrorMessage}
        >
          <Input
            id="traceroute-settings-unknown-hops"
            {...register('settings.traceroute.maxUnknownHops', {
              min: { value: 0, message: `Must be greater than 0` },
              max: { value: 20, message: `Can be no more than 20` },
            })}
            min={0}
            type="number"
            disabled={!isEditor}
          />
        </Field>
        <HorizontalCheckboxField
          id="traceroute-settings-ptr-lookup"
          label="PTR lookup"
          description="Reverse lookup hostnames from IP addresses"
          disabled={!isEditor}
          {...register('settings.traceroute.ptrLookup')}
        />
      </div>
    </Collapse>
  );
};
