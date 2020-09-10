import React, { FC, useState } from 'react';
import {
  Container,
  HorizontalGroup,
  Field,
  Select,
  Switch,
  Input,
  TextArea,
  IconButton,
  VerticalGroup,
} from '@grafana/ui';
import { useFormContext, Controller, useFieldArray } from 'react-hook-form';
import { Label, CheckType } from 'types';
import { IP_OPTIONS } from '../constants';
import { LabelField } from 'components/LabelField';
import { Collapse } from 'components/Collapse';
import { TLSConfig } from 'components/TLSConfig';

interface Props {
  isEditor: boolean;
  labels: Label[];
}

export const TcpSettingsForm: FC<Props> = ({ isEditor, labels }) => {
  const [showTCPSettings, setShowTCPSettings] = useState(false);
  const [showQueryResponse, setShowQueryResponse] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { register, control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'settings.tcp.queryResponse' });
  return (
    <Container>
      <Collapse
        label="TCP Settings"
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
            <Switch ref={register()} title="Use TLS" name="settings.tcp.tls" disabled={!isEditor} />
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
          label="Query/Response"
          description="The query sent in the TCP probe and the expected associated response. StartTLS upgrades TCP connection to TLS."
          disabled={!isEditor}
        >
          <VerticalGroup>
            {fields.map((field, index) => (
              <HorizontalGroup key={field.id}>
                <Input
                  ref={register()}
                  name={`settings.tcp.queryResponse[${index}].expect`}
                  type="text"
                  placeholder="response to expect"
                  disabled={!isEditor}
                />
                <TextArea
                  ref={register()}
                  name={`settings.tcp.queryResponse[${index}].send`}
                  type="text"
                  placeholder="data to send"
                  rows={1}
                  disabled={!isEditor}
                />
                <span>StartTLS</span>
                <Container padding="sm">
                  <Switch
                    ref={register()}
                    name={`settings.tcp.queryResponse[${index}].startTLS`}
                    label="StartTLS"
                    disabled={!isEditor}
                  />
                </Container>
                <IconButton name="minus-circle" onClick={() => remove(index)} disabled={!isEditor} />
              </HorizontalGroup>
            ))}

            <IconButton
              name="plus-circle"
              onClick={() => append({ expect: '', send: '', startTLS: false })}
              disabled={!isEditor}
            />
          </VerticalGroup>
        </Field>
      </Collapse>
      <TLSConfig isEditor={isEditor} checkType={CheckType.TCP} />
      <Collapse
        label="Advanced Options"
        onToggle={() => setShowAdvanced(!showAdvanced)}
        isOpen={showAdvanced}
        collapsible
      >
        <LabelField isEditor={isEditor} labels={labels} />
        <HorizontalGroup>
          <div>
            <Field label="IP Version" description="The IP protocol of the ICMP request" disabled={!isEditor}>
              <Controller as={Select} name="settings.tcp.ipVersion" options={IP_OPTIONS} />
            </Field>
          </div>
        </HorizontalGroup>
      </Collapse>
    </Container>
  );
};
