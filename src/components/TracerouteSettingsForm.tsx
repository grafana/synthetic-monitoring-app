import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Field, Input } from '@grafana/ui';
import { css } from '@emotion/css';

import { Collapse } from 'components/Collapse';
import { LabelField } from 'components/LabelField';

import { HorizontalCheckboxField } from './HorizonalCheckboxField';

interface Props {
  isEditor: boolean;
}

export const TracerouteSettingsForm = ({ isEditor }: Props) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { register } = useFormContext();
  return (
    <Collapse
      label="Advanced options"
      collapsible={true}
      onToggle={() => setShowAdvanced(!showAdvanced)}
      isOpen={showAdvanced}
    >
      <div
        className={css`
          max-width: 500px;
        `}
      >
        <LabelField isEditor={isEditor} />
        <Field label="Max hops" description="Maximum TTL for the trace" disabled={!isEditor}>
          <Input
            id="traceroute-settings-max-hops"
            {...register('settings.traceroute.maxHops', { min: 1, max: 64 })}
            type="number"
            disabled={!isEditor}
          />
        </Field>
        <Field
          label="Max unknown hops"
          description="Maximimum number of hosts to traverse that give no response"
          disabled={!isEditor}
        >
          <Input
            id="traceroute-settings-unknown-hops"
            {...register('settings.traceroute.maxUnknownHops', { min: 0, max: 20 })}
            type="number"
            disabled={!isEditor}
          />
        </Field>
        <HorizontalCheckboxField
          id="traceroute-settings-ptr-lookup"
          label="PTR lookup"
          name="settings.traceroute.ptrLookup"
          description="Reverse lookup hostnames from IP addresses"
          disabled={!isEditor}
        />
      </div>
    </Collapse>
  );
};
