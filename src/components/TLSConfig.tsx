import React from 'react';
import { FieldErrors, useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Container, Field, Input, TextArea } from '@grafana/ui';

import { CheckFormValuesGRPC, CheckFormValuesHttp, CheckFormValuesTcp, TLSCheckTypes, TLSFormValues } from 'types';
import { hasRole } from 'utils';
import { validateTLSCACert, validateTLSClientCert, validateTLSClientKey, validateTLSServerName } from 'validation';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';

interface Props {
  checkType: TLSCheckTypes;
}

export const TLSConfig = ({ checkType }: Props) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckFormValuesHttp | CheckFormValuesTcp | CheckFormValuesGRPC>();
  const isEditor = hasRole(OrgRole.Editor);
  const errs = getCheckTypeErrors(errors, checkType);

  return (
    <>
      <HorizontalCheckboxField
        id="tls-config-skip-validation"
        disabled={!isEditor}
        label="Disable target certificate validation"
        data-fs-element="Check disable target certificate validation checkbox"
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
          data-fs-element="TLS server name input"
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
            data-fs-element="TLS ca certificate textarea"
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
            data-fs-element="TLS client certificate textarea"
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
            data-fs-element="TLS client key textarea"
          />
        </Field>
      </Container>
    </>
  );
};

function getCheckTypeErrors(errors: FieldErrors<TLSFormValues>, checkType: Props['checkType']) {
  return errors?.settings?.[checkType];
}
