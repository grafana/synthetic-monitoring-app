import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, MultiSelect } from '@grafana/ui';

import { CheckFormValues, HttpVersion } from 'types';
import { hasRole } from 'utils';

const httpVersionOptions = [
  {
    label: 'HTTP/1.0',
    value: HttpVersion.HTTP1_0,
  },
  {
    label: 'HTTP/1.1',
    value: HttpVersion.HTTP1_1,
  },
  {
    label: 'HTTP/2',
    value: HttpVersion.HTTP2_0,
  },
];

export const HttpCheckValidHttpVersions = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const { control } = useFormContext<CheckFormValues>();
  const id = 'http-settings-valid-http-versions';

  return (
    <Field
      label="Valid HTTP versions"
      description="Accepted HTTP versions for this probe"
      disabled={!isEditor}
      htmlFor={id}
      data-fs-element="Valid http versions select"
    >
      <Controller
        control={control}
        name="settings.http.validHTTPVersions"
        render={({ field }) => {
          const { ref, ...rest } = field;

          return <MultiSelect {...rest} options={httpVersionOptions} disabled={!isEditor} inputId={id} />;
        }}
      />
    </Field>
  );
};
