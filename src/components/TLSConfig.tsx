import React, { useState } from 'react';
import { DeepMap, FieldError, useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Container, Field, Input, TextArea } from '@grafana/ui';

import { CheckFormValuesHttp, CheckFormValuesTcp, CheckType } from 'types';
import { hasRole } from 'utils';
import { validateTLSCACert, validateTLSClientCert, validateTLSClientKey, validateTLSServerName } from 'validation';
import { Collapse } from 'components/Collapse';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';

interface Props {
  checkType: CheckType.HTTP | CheckType.TCP;
}

export const TLSConfig = ({ checkType }: Props) => {
  const [showTLS, setShowTLS] = useState(false);
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckFormValuesHttp | CheckFormValuesTcp>();
  const isEditor = hasRole(OrgRole.Editor);
  const errs = isErrorsHttp(errors) ? errors.settings?.http : isErrorsTcp(errors) ? errors.settings?.tcp : undefined;

  return (
    <Collapse label="TLS config" onToggle={() => setShowTLS(!showTLS)} isOpen={showTLS}>
      <HorizontalCheckboxField
        id="tls-config-skip-validation"
        disabled={!isEditor}
        label="Disable target certificate validation"
        {...register(`settings.${checkType}.tlsConfig.insecureSkipVerify`)}
      />
      <Field
        label="Server name"
        description="Used to verify the hostname for the targets"
        disabled={!isEditor}
        invalid={Boolean(errs?.tlsConfig?.serverName)}
        error={errs?.tlsConfig?.serverName?.message}
      >
        <Input
          id="tls-config-server-name"
          {...register(`settings.${checkType}.tlsConfig.serverName`, {
            validate: (value) => validateTLSServerName(value),
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
          invalid={Boolean(errs?.tlsConfig?.caCert)}
          error={errs?.tlsConfig?.caCert?.message}
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
          description="The client cert file for the targets. The certificate must be in PEM format."
          disabled={!isEditor}
          invalid={Boolean(errs?.tlsConfig?.clientCert)}
          error={errs?.tlsConfig?.clientCert?.message}
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
          invalid={Boolean(errs?.tlsConfig?.clientKey)}
          error={errs?.tlsConfig?.clientKey?.message}
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

function isErrorsHttp(errors: any): errors is DeepMap<CheckFormValuesHttp, FieldError> {
  if (Object.hasOwnProperty.call(errors?.settings || {}, 'http')) {
    return true;
  }

  return false;
}

function isErrorsTcp(errors: any): errors is DeepMap<CheckFormValuesTcp, FieldError> {
  if (Object.hasOwnProperty.call(errors?.settings || {}, 'tcp')) {
    return true;
  }

  return false;
}
