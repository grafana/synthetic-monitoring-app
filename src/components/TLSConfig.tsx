import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Container, Field, Input, TextArea } from '@grafana/ui';
import { get } from 'lodash';

import { TLSConfigFields } from './CheckEditor/CheckEditor.types';
import { CheckFormValues } from 'types';
import { hasRole } from 'utils';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';

interface Props {
  fields: Required<TLSConfigFields>;
}

export const TLSConfig = ({ fields }: Props) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckFormValues>();
  const isEditor = hasRole(OrgRole.Editor);
  const tlsInsecureSkipVerify = fields.tlsInsecureSkipVerify.name;
  const serverName = fields.tlsServerName.name;
  const caCert = fields.tlsCaSCert.name;
  const clientCert = fields.tlsClientCert.name;
  const clientKey = fields.tlsClientKey.name;

  const serverNameError = get(errors, serverName);
  const caCertError = get(errors, caCert);
  const clientCertError = get(errors, clientCert);
  const clientKeyError = get(errors, clientKey);

  return (
    <>
      <HorizontalCheckboxField
        id="tls-config-skip-validation"
        disabled={!isEditor}
        label="Disable target certificate validation"
        data-fs-element="Check disable target certificate validation checkbox"
        {...register(tlsInsecureSkipVerify)}
      />
      <Field
        label="Server name"
        description="Used to verify the hostname for the targets"
        disabled={!isEditor}
        invalid={Boolean(serverNameError)}
        error={serverNameError?.message}
      >
        <Input
          id="tls-config-server-name"
          {...register(serverName)}
          type="text"
          placeholder="Server name"
          disabled={!isEditor}
          data-fs-element="TLS server name input"
        />
      </Field>
      <Container>
        <Field
          label="CA certificate"
          description="Certificate must be in PEM format."
          disabled={!isEditor}
          invalid={Boolean(caCertError)}
          error={caCertError?.message}
        >
          <TextArea
            id="tls-config-ca-certificate"
            {...register(caCert)}
            rows={2}
            disabled={!isEditor}
            placeholder="CA certificate"
            data-fs-element="TLS ca certificate textarea"
          />
        </Field>
      </Container>
      <Container>
        <Field
          label="Client certificate"
          description="The client cert file for the targets. The certificate must be in PEM format."
          disabled={!isEditor}
          invalid={Boolean(clientCertError)}
          error={clientCertError?.message}
        >
          <TextArea
            id="tls-config-client-cert"
            {...register(clientCert)}
            rows={2}
            disabled={!isEditor}
            placeholder="Client certificate"
            data-fs-element="TLS client certificate textarea"
          />
        </Field>
      </Container>
      <Container>
        <Field
          label="Client key"
          description="The client key file for the targets. The key must be in PEM format."
          disabled={!isEditor}
          invalid={Boolean(clientKeyError)}
          error={clientKeyError?.message}
        >
          <TextArea
            id="tls-config-client-key"
            {...register(clientKey)}
            type="password"
            rows={2}
            disabled={!isEditor}
            placeholder="Client key"
            data-fs-element="TLS client key textarea"
          />
        </Field>
      </Container>
    </>
  );
};
