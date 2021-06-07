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
  const {
    register,
    formState: { errors },
  } = useFormContext();

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
          {...register(`settings.${checkType}.tlsConfig.serverName`, {
            validate: validateTLSServerName,
            required: false,
          })}
          type="text"
          placeholder="Server name"
          disabled={!isEditor}
        />
      </Field>
      <Container>
        <Field
          label="CA certificate"
          description="Certificate must be in PEM format."
          disabled={!isEditor}
          invalid={Boolean(errors.settings?.[checkType]?.tlsConfig?.caCert)}
          error={errors.settings?.[checkType]?.tlsConfig?.caCert?.message}
        >
          <TextArea
            id="tls-config-ca-certificate"
            {...register(`settings.${checkType}.tlsConfig.caCert`, {
              validate: validateTLSCACert,
              required: false,
            })}
            rows={2}
            disabled={!isEditor}
            placeholder="CA certificate"
          />
        </Field>
      </Container>
      <Container>
        <Field
          label="Client certificate"
          description="The client cert file for the targets. The certificate muse be in PEM format."
          disabled={!isEditor}
          invalid={Boolean(errors?.settings?.[checkType]?.tlsConfig?.clientCert)}
          error={errors?.settings?.[checkType]?.tlsConfig?.clientCert?.message}
        >
          <TextArea
            id="tls-config-client-cert"
            {...register(`settings.${checkType}.tlsConfig.clientCert`, {
              validate: validateTLSClientCert,
              required: false,
            })}
            rows={2}
            disabled={!isEditor}
            placeholder="Client certificate"
          />
        </Field>
      </Container>
      <Container>
        <Field
          label="Client key"
          description="The client key file for the targets. The key must be in PEM format."
          disabled={!isEditor}
          invalid={Boolean(errors?.settings?.[checkType]?.tlsConfig?.clientKey)}
          error={errors?.settings?.[checkType]?.tlsConfig?.clientKey?.message}
        >
          <TextArea
            id="tls-config-client-key"
            {...register(`settings.${checkType}.tlsConfig.clientKey`, {
              validate: validateTLSClientKey,
              required: false,
            })}
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
