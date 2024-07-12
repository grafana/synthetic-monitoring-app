import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Container, Field, Input, TextArea } from '@grafana/ui';
import { get } from 'lodash';

import { TLSConfigFields } from './CheckEditor/CheckEditor.types';
import { CheckFormValues } from 'types';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';

interface TLSConfigProps {
  disabled?: boolean;
  fields: TLSConfigFields;
}

export const TLSConfig = ({ disabled, fields }: TLSConfigProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckFormValues>();
  const tlsInsecureSkipVerify = fields.tlsInsecureSkipVerify?.name;
  const serverName = fields.tlsServerName?.name;
  const caCert = fields.tlsCaSCert?.name;
  const clientCert = fields.tlsClientCert?.name;
  const clientKey = fields.tlsClientKey?.name;

  const serverNameError = serverName && get(errors, serverName);
  const caCertError = caCert && get(errors, caCert);
  const clientCertError = clientCert && get(errors, clientCert);
  const clientKeyError = clientKey && get(errors, clientKey);

  return (
    <>
      {tlsInsecureSkipVerify && (
        <HorizontalCheckboxField
          id="tls-config-skip-validation"
          disabled={disabled}
          label="Disable target certificate validation"
          data-fs-element="Check disable target certificate validation checkbox"
          {...register(tlsInsecureSkipVerify)}
        />
      )}
      {serverName && (
        <Field
          label="Server name"
          description="Used to verify the hostname for the targets"
          disabled={disabled}
          invalid={Boolean(serverNameError)}
          error={serverNameError?.message}
        >
          <Input
            id="tls-config-server-name"
            {...register(serverName)}
            type="text"
            placeholder="Server name"
            disabled={disabled}
            data-fs-element="TLS server name input"
          />
        </Field>
      )}
      {caCert && (
        <Container>
          <Field
            label="CA certificate"
            description="Certificate must be in PEM format."
            disabled={disabled}
            invalid={Boolean(caCertError)}
            error={caCertError?.message}
          >
            <TextArea
              id="tls-config-ca-certificate"
              {...register(caCert)}
              rows={2}
              disabled={disabled}
              placeholder="CA certificate"
              data-fs-element="TLS ca certificate textarea"
            />
          </Field>
        </Container>
      )}
      {clientCert && (
        <Container>
          <Field
            label="Client certificate"
            description="The client cert file for the targets. The certificate must be in PEM format."
            disabled={disabled}
            invalid={Boolean(clientCertError)}
            error={clientCertError?.message}
          >
            <TextArea
              id="tls-config-client-cert"
              {...register(clientCert)}
              rows={2}
              disabled={disabled}
              placeholder="Client certificate"
              data-fs-element="TLS client certificate textarea"
            />
          </Field>
        </Container>
      )}
      {clientKey && (
        <Container>
          <Field
            label="Client key"
            description="The client key file for the targets. The key must be in PEM format."
            disabled={disabled}
            invalid={Boolean(clientKeyError)}
            error={clientKeyError?.message}
          >
            <TextArea
              id="tls-config-client-key"
              {...register(clientKey)}
              type="password"
              rows={2}
              disabled={disabled}
              placeholder="Client key"
              data-fs-element="TLS client key textarea"
            />
          </Field>
        </Container>
      )}
    </>
  );
};
