import React, { FC, useState } from 'react';
import { Container, HorizontalGroup, Field, Select, Switch } from '@grafana/ui';
import { Collapse } from 'components/Collapse';
import { IP_OPTIONS } from './constants';
import { LabelField } from 'components/LabelField';
import { useFormContext, Controller } from 'react-hook-form';

interface Props {
  isEditor: boolean;
}

export const PingSettingsForm: FC<Props> = ({ isEditor }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { control, register } = useFormContext();

  return (
    <Collapse
      label="Advanced Options"
      collapsible={true}
      onToggle={() => setShowAdvanced(!showAdvanced)}
      isOpen={showAdvanced}
    >
      <LabelField isEditor={isEditor} />
      <HorizontalGroup>
        <div>
          <Field label="IP Version" description="The IP protocol of the ICMP request" disabled={!isEditor}>
            <Controller
              name="settings.ping.ipVersion"
              as={Select}
              control={control}
              options={IP_OPTIONS}
              rules={{ required: true }}
            />
          </Field>
        </div>
        <div>
          <Field
            label="Don't Fragment"
            description="Set the DF-bit in the IP-header. Only works with ipV4"
            disabled={!isEditor}
          >
            <Container padding="sm">
              <Switch ref={register()} name="settings.ping.dontFragment" disabled={!isEditor} />
            </Container>
          </Field>
        </div>
      </HorizontalGroup>
    </Collapse>
  );
};
