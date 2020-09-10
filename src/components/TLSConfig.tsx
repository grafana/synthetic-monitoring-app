import React, { FC, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { HorizontalGroup, Field, Input, Container, TextArea, Switch } from '@grafana/ui';
import { Collapse } from 'components/Collapse';
import { CheckType } from 'types';

interface Props {
  isEditor: boolean;
  checkType: CheckType;
}

export const TLSConfig: FC<Props> = ({ isEditor, checkType }) => {
  const [showTLS, setShowTLS] = useState(false);
  const { register } = useFormContext();
  return (
    <Collapse label="TLS Config" onToggle={() => setShowTLS(!showTLS)} isOpen={showTLS} collapsible>
      <HorizontalGroup>
        <Field label="Skip Validation" description="Disable target certificate validation" disabled={!isEditor}>
          <Container padding="sm">
            <Switch ref={register()} name={`settings.${checkType}.tlsConfig.insecureSkipVerify`} disabled={!isEditor} />
          </Container>
        </Field>
        <Field label="Server Name" description="Used to verify the hostname for the targets" disabled={!isEditor}>
          <Input
            ref={register()}
            name={`settings.${checkType}.tlsConfig.serverName`}
            type="text"
            placeholder="ServerName"
            disabled={!isEditor}
          />
        </Field>
      </HorizontalGroup>
      <Container>
        <Field label="CA Certificate" description="The CA cert to use for the targets" disabled={!isEditor}>
          <TextArea
            ref={register()}
            name={`settings.${checkType}.tlsConfig.caCert`}
            rows={2}
            disabled={!isEditor}
            placeholder="CA Certificate"
          />
        </Field>
      </Container>
      <Container>
        <Field label="Client Certificate" description="The client cert file for the targets" disabled={!isEditor}>
          <TextArea
            ref={register()}
            name={`settings.${checkType}.tlsConfig.caCert`}
            rows={2}
            disabled={!isEditor}
            placeholder="Client Certificate"
          />
        </Field>
      </Container>
      <Container>
        <Field label="Client Key" description="The client key file for the targets" disabled={!isEditor}>
          <TextArea
            ref={register()}
            name={`settings.${checkType}.tlsConfig.clientKey`}
            type="password"
            rows={2}
            disabled={!isEditor}
            placeholder="Client Key"
          />
        </Field>
      </Container>
    </Collapse>
  );
};
