import React from 'react';
import { Controller } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, Select } from '@grafana/ui';

import { hasRole } from 'utils';
import { HTTP_COMPRESSION_ALGO_OPTIONS } from 'components/constants';

export const HttpCheckCompressionOption = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const compressionId = 'http-settings-compression';

  return (
    <Field
      label="Compression option"
      description="The compression algorithm to expect in the response body"
      disabled={!isEditor}
      htmlFor={compressionId}
    >
      <Controller
        name="settings.http.compression"
        render={({ field }) => {
          const { ref, ...rest } = field;
          return <Select {...rest} inputId={compressionId} options={HTTP_COMPRESSION_ALGO_OPTIONS} />;
        }}
      />
    </Field>
  );
};
