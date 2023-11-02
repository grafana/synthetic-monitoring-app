import React, { useState } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import {
  Button,
  Container,
  Field,
  HorizontalGroup,
  IconButton,
  Input,
  Select,
  Switch,
  TextArea,
  VerticalGroup,
} from '@grafana/ui';

import { CheckType } from 'types';
import { Collapse } from 'components/Collapse';
import { LabelField } from 'components/LabelField';
import { TLSConfig } from 'components/TLSConfig';

import { IP_OPTIONS } from '../constants';

interface Props {
  isEditor: boolean;
}

export const TcpSettingsForm = ({ isEditor }: Props) => {
  const [showTCPSettings, setShowTCPSettings] = useState(false);
  const [showQueryResponse, setShowQueryResponse] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { register, control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'settings.tcp.queryResponse' });
  return (
    <Container>
      <Collapse
        label="TCP settings"
        onToggle={() => setShowTCPSettings(!showTCPSettings)}
        isOpen={showTCPSettings}
        collapsible
      >
        <Field
          label="Use TLS"
          description="Whether or not TLS is used when the connection is initiated."
          disabled={!isEditor}
        >
          <Container padding="sm">
            <Switch {...register('settings.tcp.tls')} title="Use TLS" disabled={!isEditor} />
          </Container>
        </Field>
      </Collapse>
      <Collapse
        label="Query/Response"
        onToggle={() => setShowQueryResponse(!showQueryResponse)}
        isOpen={showQueryResponse}
        collapsible
      >
        <Field
          label="Query and response"
          description="The query sent in the TCP probe and the expected associated response. StartTLS upgrades TCP connection to TLS."
          disabled={!isEditor}
        >
          <VerticalGroup>
            {fields.map((field, index) => (
              <HorizontalGroup key={field.id}>
                <Input
                  {...register(`settings.tcp.queryResponse.${index}.expect` as const)}
                  type="text"
                  placeholder="Response to expect"
                  disabled={!isEditor}
                />
                <TextArea
                  {...register(`settings.tcp.queryResponse.${index}.send` as const)}
                  type="text"
                  placeholder="Data to send"
                  rows={1}
                  disabled={!isEditor}
                />
                <span>StartTLS</span>
                <Container padding="sm">
                  <Switch
                    {...register(`settings.tcp.queryResponse.${index}.startTLS` as const)}
                    label="StartTLS"
                    disabled={!isEditor}
                  />
                </Container>
                <IconButton name="minus-circle" onClick={() => remove(index)} disabled={!isEditor} tooltip="Delete" />
              </HorizontalGroup>
            ))}

            <Button
              size="sm"
              variant="secondary"
              onClick={() => append({ expect: '', send: '', startTLS: false })}
              disabled={!isEditor}
            >
              Add query/response
            </Button>
          </VerticalGroup>
        </Field>
      </Collapse>
      <TLSConfig isEditor={isEditor} checkType={CheckType.TCP} />
      <Collapse
        label="Advanced options"
        onToggle={() => setShowAdvanced(!showAdvanced)}
        isOpen={showAdvanced}
        collapsible
      >
        <LabelField isEditor={isEditor} />
        <HorizontalGroup>
          <div>
            <Field label="IP version" description="The IP protocol of the ICMP request" disabled={!isEditor}>
              <Controller
                name="settings.tcp.ipVersion"
                render={({ field }) => <Select {...field} options={IP_OPTIONS} defaultValue={IP_OPTIONS[1]} />}
              />
            </Field>
          </div>
        </HorizontalGroup>
      </Collapse>
    </Container>
  );
};
