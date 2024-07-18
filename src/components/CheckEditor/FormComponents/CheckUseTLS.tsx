import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Field, Switch } from '@grafana/ui';

import { TLSCheckTypes, TLSFormValues } from 'types';

interface CheckUseTLSProps {
  checkType: TLSCheckTypes;
  disabled?: boolean;
}

export const CheckUseTLS = ({ checkType, disabled }: CheckUseTLSProps) => {
  const { register } = useFormContext<TLSFormValues>();
  const id = `${checkType}-settings-use-tls`;

  return (
    <Field label="Use TLS" description="Whether or not TLS is used when the connection is initiated." htmlFor={id}>
      <Switch
        {...register(`settings.${checkType}.tls`)}
        title="Use TLS"
        disabled={disabled}
        id={id}
        data-fs-element="Use TLS switch"
      />
    </Field>
  );
};
