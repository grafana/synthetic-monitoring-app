import React from 'react';
import { Controller, FieldPath, useFormContext } from 'react-hook-form';
import { Combobox, ComboboxOption, Field } from '@grafana/ui';

import { CheckFormValues } from 'types';
import { useDOMId } from 'hooks/useDOMId';
import { IP_OPTIONS } from 'components/constants';

type CheckIpVersionProps = {
  description: string;
  disabled?: boolean;
  name: FieldPath<CheckFormValues>;
};

export const CheckIpVersion = ({ description, disabled, name }: CheckIpVersionProps) => {
  const { control } = useFormContext<CheckFormValues>();
  const id = useDOMId();

  return (
    <Field label="IP version" description={description} htmlFor={id} data-fs-element="IP version select">
      <Controller
        control={control}
        render={({ field }) => {
          const { ref, onChange, ...rest } = field;
          return (
            <Combobox
              {...rest}
              disabled={disabled}
              options={IP_OPTIONS}
              id={id}
              value={rest.value as ComboboxOption<string | number>}
              onChange={({ value }) => {
                onChange(value);
              }}
            />
          );
        }}
        name={name}
      />
    </Field>
  );
};
