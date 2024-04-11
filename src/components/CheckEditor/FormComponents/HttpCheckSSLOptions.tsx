import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, Select } from '@grafana/ui';

import { CheckFormValuesHttp } from 'types';
import { hasRole } from 'utils';
import { HTTP_SSL_OPTIONS } from 'components/constants';

export const HttpCheckSSLOptions = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const { control } = useFormContext<CheckFormValuesHttp>();
  const id = 'http-settings-ssl-options';

  return (
    <Field
      label="SSL options"
      description="Choose whether probe fails if SSL is present or not present"
      disabled={!isEditor}
      htmlFor={id}
      data-fs-element="SSL options select"
    >
      <Controller<CheckFormValuesHttp>
        name="settings.http.sslOptions"
        control={control}
        render={({ field }) => {
          const { ref, ...rest } = field;
          return <Select {...rest} inputId={id} options={HTTP_SSL_OPTIONS} disabled={!isEditor} />;
        }}
      />
    </Field>
  );
};
