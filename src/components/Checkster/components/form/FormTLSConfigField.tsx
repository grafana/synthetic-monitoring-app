import React from 'react';
import { Stack } from '@grafana/ui';

import { CheckFormFieldPath, TLSBaseFieldPath } from '../../types';

import { FIELD_SPACING } from '../../constants';
import { GenericCheckboxField } from './generic/GenericCheckboxField';
import { GenericInputField } from './generic/GenericInputField';
import { GenericTextareaField } from './generic/GenericTextareaField';
import { FormSecretOrPlaintextField } from './FormSecretOrPlaintextField';

interface FormTLSConfigFieldProps {
  field: TLSBaseFieldPath; // TODO: This should be a narrow type (that validates that the path has TLS config child paths)
  useTLS?: true; // gRPC + TCP (leave undefined for HTTP)
  allowSecrets?: boolean; // HTTP only: allow cert/key fields to reference a secret
}

type TLSConfigKey = 'serverName' | 'insecureSkipVerify' | 'caCert' | 'clientCert' | 'clientKey';

function getTLSConfigField(settingsField: TLSBaseFieldPath, name: TLSConfigKey) {
  return `${settingsField}.tlsConfig.${name}` as const;
}

export function FormTLSConfigField({ field, useTLS, allowSecrets }: FormTLSConfigFieldProps) {
  const tlsField = `${field}.tls` as any; // TODO: `tls` is missing in `settings.http`, better typing?
  const insecureSkipVerify = getTLSConfigField(field, 'insecureSkipVerify');
  const serverName = getTLSConfigField(field, 'serverName');
  const caCert = getTLSConfigField(field, 'caCert');
  const clientCert = getTLSConfigField(field, 'clientCert');
  const clientKey = getTLSConfigField(field, 'clientKey');

  const renderCert = (certField: CheckFormFieldPath, label: string, description: string, placeholder: string) =>
    allowSecrets ? (
      <FormSecretOrPlaintextField
        field={certField}
        label={label}
        description={description}
        variant="textarea"
        rows={3}
        placeholder={placeholder}
        allowSecrets
      />
    ) : (
      <GenericTextareaField field={certField} label={label} description={description} rows={3} placeholder={placeholder} />
    );

  return (
    <Stack direction="column" gap={FIELD_SPACING}>
      {useTLS && (
        <GenericCheckboxField
          field={tlsField}
          label="Use TLS"
          description="Whether or not TLS is used when the connection is initiated."
        />
      )}
      <GenericCheckboxField field={insecureSkipVerify} label="Disable target certificate validation" />
      <GenericInputField
        field={serverName}
        label="Server name"
        description="Used to verify the hostname for the targets"
        placeholder="grafana.com"
      />
      {renderCert(
        caCert,
        'CA certificate',
        'Certificate must be in PEM format.',
        `-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----`
      )}
      {renderCert(
        clientCert,
        'Client certificate',
        'The client cert file for the targets. The certificate must be in PEM format.',
        `-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----`
      )}
      {renderCert(
        clientKey,
        'Client key',
        'The client key file for the targets. The key must be in PEM format.',
        `----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----`
      )}
    </Stack>
  );
}
