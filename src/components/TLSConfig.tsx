import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Field, Input, Container, TextArea } from '@grafana/ui';
import { Collapse } from 'components/Collapse';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';
import { CheckType } from 'types';
import { validateTLSCACert, validateTLSClientCert, validateTLSClientKey, validateTLSServerName } from 'validation';

interface Props {
  isEditor: boolean;
  checkType: CheckType;
}

export const TLSConfig = ({ isEditor, checkType }: Props) => {
  const [showTLS, setShowTLS] = useState(false);
  const { register, errors } = useFormContext();
  return (
    <Collapse label="TLS config" onToggle={() => setShowTLS(!showTLS)} isOpen={showTLS} collapsible>
      <HorizontalCheckboxField
        id="tls-config-skip-validation"
        name={`settings.${checkType}.tlsConfig.insecureSkipVerify`}
        disabled={!isEditor}
        label="Disable target certificate validation"
      />
      <Field
        label="Server name"
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
          placeholder="Server name"
          disabled={!isEditor}
        />
      </Field>
      <Container>
        <Field
          label="CA certificate"
          description="The CA cert to use for the targets"
          disabled={!isEditor}
          invalid={Boolean(errors.settings?.[checkType]?.tlsConfig?.caCert)}
          error={errors.settings?.[checkType]?.tlsConfig?.caCert?.message}
        >
          <TextArea
            id="tls-config-ca-certificate"
            ref={register({
              validate: validateTLSCACert,
            })}
            name={`settings.${checkType}.tlsConfig.caCert`}
            rows={2}
            disabled={!isEditor}
            placeholder="CA certificate"
          />
        </Field>
      </Container>
      <Container>
        <Field
          label="Client certificate"
          description="The client cert file for the targets"
          disabled={!isEditor}
          invalid={Boolean(errors?.settings?.[checkType]?.tlsConfig?.clientCert)}
          error={errors?.settings?.[checkType]?.tlsConfig?.clientCert?.message}
        >
          <TextArea
            id="tls-config-client-cert"
            ref={register({
              validate: validateTLSClientCert,
            })}
            name={`settings.${checkType}.tlsConfig.clientCert`}
            rows={2}
            disabled={!isEditor}
            placeholder="Client certificate"
          />
        </Field>
      </Container>
      <Container>
        <Field
          label="Client key"
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
            placeholder="Client key"
          />
        </Field>
      </Container>
    </Collapse>
  );
};
