import React, { FC, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { HorizontalGroup, Field, Input, Container, TextArea, Switch } from '@grafana/ui';
import { Collapse } from 'components/Collapse';
import { CheckType } from 'types';
import { validateTLSCACert, validateTLSClientCert, validateTLSClientKey, validateTLSServerName } from 'validation';

interface Props {
  isEditor: boolean;
  checkType: CheckType;
}

export const TLSConfig: FC<Props> = ({ isEditor, checkType }) => {
  const [showTLS, setShowTLS] = useState(false);
  const { register, errors } = useFormContext();
  return (
    <Collapse label="TLS Config" onToggle={() => setShowTLS(!showTLS)} isOpen={showTLS} collapsible>
      <HorizontalGroup>
        <Field label="Skip Validation" description="Disable target certificate validation" disabled={!isEditor}>
          <Switch
            id="tls-config-skip-validation"
            ref={register}
            name={`settings.${checkType}.tlsConfig.insecureSkipVerify`}
            disabled={!isEditor}
          />
        </Field>
        <Field
          label="Server Name"
          description="Used to verify the hostname for the targets"
          disabled={!isEditor}
          invalid={Boolean(errors.settings?.[checkType]?.tlsConfig?.serverName)}
          error={errors.settings?.[checkType]?.tlsConfig?.serverName}
        >
          <Input
            id="tls-config-server-name"
            ref={register({
              validate: validateTLSServerName,
            })}
            name={`settings.${checkType}.tlsConfig.serverName`}
            type="text"
            placeholder="ServerName"
            disabled={!isEditor}
          />
        </Field>
      </HorizontalGroup>
      <Container>
        <Field
          label="CA Certificate"
          description="The CA cert to use for the targets"
          disabled={!isEditor}
          invalid={Boolean(errors.settings?.[checkType]?.tlsConfig?.caCert)}
          error={errors.settings?.[checkType]?.tlsConfig?.caCert}
        >
          <TextArea
            id="tls-config-ca-certificate"
            ref={register({
              validate: validateTLSCACert,
            })}
            name={`settings.${checkType}.tlsConfig.caCert`}
            rows={2}
            disabled={!isEditor}
            placeholder="CA Certificate"
          />
        </Field>
      </Container>
      <Container>
        <Field
          label="Client Certificate"
          description="The client cert file for the targets"
          disabled={!isEditor}
          invalid={Boolean(errors?.settings?.[checkType]?.tlsConfig?.clientCert)}
          error={errors?.settings?.[checkType]?.tlsConfig?.clientCert}
        >
          <TextArea
            id="tls-config-client-cert"
            ref={register({
              validate: validateTLSClientCert,
            })}
            name={`settings.${checkType}.tlsConfig.clientCert`}
            rows={2}
            disabled={!isEditor}
            placeholder="Client Certificate"
          />
        </Field>
      </Container>
      <Container>
        <Field
          label="Client Key"
          description="The client key file for the targets"
          disabled={!isEditor}
          invalid={Boolean(errors?.settings?.[checkType]?.tlsConfig?.clientKey)}
          error={errors?.settings?.[checkType]?.tlsConfig?.clientKey}
        >
          <TextArea
            id="tls-config-client-key"
            ref={register({ validate: validateTLSClientKey })}
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
