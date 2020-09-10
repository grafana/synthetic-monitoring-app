import React, { FC, useState } from 'react';
import { Container, HorizontalGroup, Field, Select, Switch } from '@grafana/ui';
import { Collapse } from 'components/Collapse';
import { PingSettings, Label } from 'types';
import { IP_OPTIONS } from './constants';
import { LabelField } from 'components/LabelField';
import { useFormContext, Controller } from 'react-hook-form';

interface Props {
  settings?: PingSettings;
  labels: Label[];
  isEditor: boolean;
}

export const PingSettingsForm: FC<Props> = ({ isEditor, settings, labels }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { control, register } = useFormContext();

  return (
    <Collapse
      label="Advanced Options"
      collapsible={true}
      onToggle={() => setShowAdvanced(!showAdvanced)}
      isOpen={showAdvanced}
    >
      <LabelField labels={labels} isEditor={isEditor} />
      <HorizontalGroup>
        <div>
          <Field label="IP Version" description="The IP protocol of the ICMP request" disabled={!isEditor}>
            <Controller
              name="ipVersion"
              as={Select}
              control={control}
              options={IP_OPTIONS}
              defaultValue={IP_OPTIONS.find(option => option.value === settings?.ipVersion) ?? IP_OPTIONS[0]}
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
              <Switch ref={register()} name="dontFragment" disabled={!isEditor} />
            </Container>
          </Field>
        </div>
      </HorizontalGroup>
    </Collapse>
  );
};
