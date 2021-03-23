import React, { useState } from 'react';
import { css } from 'emotion';
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
            ref={register({ min: 1, max: 63 })}
            name="settings.traceroute.firstHop"
            disabled={!isEditor}
          />
        </Field>
        <Field label="Max hops" description="Maximum TTL for the trace" disabled={!isEditor}>
          <Input
            id="traceroute-settings-max-hops"
            ref={register({ min: 1, max: 64 })}
            name="settings.traceroute.maxHops"
            type="number"
            disabled={!isEditor}
          />
        </Field>
        <Field label="Retries" description="Quantity of times to retry a hop" disabled={!isEditor}>
          <Input
            id="traceroute-settings-retries"
            ref={register({ min: 1, max: 3 })}
            name="settings.traceroute.retries"
            type="number"
            disabled={!isEditor}
          />
        </Field>
        <Field label="Packet size" description="Size of the packet to send" disabled={!isEditor}>
          <Input
            id="traceroute-settings-packet-size"
            ref={register({ min: 1, max: 1000 })}
            name="settings.traceroute.packetSize"
            type="number"
            disabled={!isEditor}
          />
        </Field>
        <Field label="Port" description="Port to send requests" disabled={!isEditor}>
          <Input
            id="traceroute-settings-port"
            ref={register({ min: 0, max: 65535 })}
            name="settings.traceroute.port"
            type="number"
            disabled={!isEditor}
          />
        </Field>
      </div>
    </Collapse>
  );
};
