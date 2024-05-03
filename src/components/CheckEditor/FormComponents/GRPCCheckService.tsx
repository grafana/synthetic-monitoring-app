import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, Input } from '@grafana/ui';

import { CheckFormValuesGRPC } from 'types';
import { hasRole } from 'utils';

export const GRPCCheckService = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const { formState, register } = useFormContext<CheckFormValuesGRPC>();

  return (
    <Field
      label="Service"
      description={'Service to perform health check against'}
      disabled={!isEditor}
      invalid={Boolean(formState.errors?.settings?.grpc?.service)}
      error={formState.errors?.settings?.grpc?.message}
    >
      <Input
        id="check-editor-grpc-service-input"
        {...register('settings.grpc.service')}
        type="text"
        placeholder="service"
        data-fs-element="gRPC service name input"
      />
    </Field>
  );
};
