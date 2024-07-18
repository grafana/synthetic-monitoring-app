import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Field, Input } from '@grafana/ui';

import { CheckFormValuesGRPC } from 'types';

export const GRPCCheckService = ({ disabled }: { disabled?: boolean }) => {
  const { formState, register } = useFormContext<CheckFormValuesGRPC>();

  return (
    <Field
      label="Service"
      description={'Service to perform health check against'}
      invalid={Boolean(formState.errors?.settings?.grpc?.service)}
      error={formState.errors?.settings?.grpc?.message}
    >
      <Input
        {...register('settings.grpc.service')}
        data-fs-element="gRPC service name input"
        disabled={disabled}
        id="check-editor-grpc-service-input"
        placeholder="service"
        type="text"
      />
    </Field>
  );
};
