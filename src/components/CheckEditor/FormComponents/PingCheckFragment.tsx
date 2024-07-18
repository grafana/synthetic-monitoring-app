import React from 'react';
import { FieldPath, useFormContext } from 'react-hook-form';
import { Field, Switch } from '@grafana/ui';

import { CheckFormValuesPing } from 'types';

interface PingCheckFragmentProps {
  disabled?: boolean;
  name: FieldPath<CheckFormValuesPing>;
}

export const PingCheckFragment = ({ disabled, name }: PingCheckFragmentProps) => {
  const { register } = useFormContext<CheckFormValuesPing>();
  const id = 'ping-settings-dont-fragment';

  return (
    <Field
      description="Set the DF-bit in the IP-header. Only works with ipV4"
      disabled={disabled}
      htmlFor={id}
      label="Don't fragment"
    >
      <Switch id={id} {...register(name)} disabled={disabled} data-fs-element="Do not fragment switch" />
    </Field>
  );
};
