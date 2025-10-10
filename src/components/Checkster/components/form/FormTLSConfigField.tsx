import React from 'react';
import { Stack } from '@grafana/ui';

import { TLSBaseFieldPath } from '../../types';

import { FIELD_SPACING } from '../../constants';
import { GenericCheckboxField } from './generic/GenericCheckboxField';
import { GenericInputField } from './generic/GenericInputField';
import { GenericTextareaField } from './generic/GenericTextareaField';

interface FormTLSConfigFieldProps {
  field: TLSBaseFieldPath; // TODO: This should be a narrow type (that validates that the path has TLS config child paths)
  useTLS?: true; // gRPC + TCP (leave undefined for HTTP)
}

type TLSConfigKey = 'serverName' | 'insecureSkipVerify' | 'caCert' | 'clientCert' | 'clientKey';

function getTLSConfigField(settingsField: TLSBaseFieldPath, name: TLSConfigKey) {
  return `${settingsField}.tlsConfig.${name}` as const;
}

export function FormTLSConfigField({ field, useTLS }: FormTLSConfigFieldProps) {
  const tlsField = `${field}.tls` as any; // TODO: `tls` is missing in `settings.http`, better typing?
  const insecureSkipVerify = getTLSConfigField(field, 'insecureSkipVerify');
  const serverName = getTLSConfigField(field, 'serverName');
  const caCert = getTLSConfigField(field, 'caCert');
  const clientCert = getTLSConfigField(field, 'clientCert');
  const clientKey = getTLSConfigField(field, 'clientKey');

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
      <GenericTextareaField
        field={caCert}
        label="CA certificate"
        description="Certificate must be in PEM format."
        rows={3}
        placeholder={`-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----`}
      />
      <GenericTextareaField
        field={clientCert}
        label="Client certificate"
        description="The client cert file for the targets. The certificate must be in PEM format."
        rows={3}
        placeholder={`-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----`}
      />
      <GenericTextareaField
        field={clientKey}
        label="Client key"
        description="The client key file for the targets. The key must be in PEM format."
        rows={3}
        placeholder={`----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----`}
      />
    </Stack>
  );
}
