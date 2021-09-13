import React, { useState } from 'react';
import { css } from '@emotion/css';
import { Field, Input } from '@grafana/ui';
import { Collapse } from 'components/Collapse';
import { LabelField } from 'components/LabelField';
import { useFormContext } from 'react-hook-form';

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
        <Field label="First hop" description="Starting TTL value" disabled={!isEditor}>
          <Input
            id="traceroute-settings-first-hop"
            {...register('settings.traceroute.firstHop', { min: 1, max: 63 })}
            disabled={!isEditor}
          />
        </Field>
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
      </div>
    </Collapse>
  );
};
