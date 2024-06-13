import React, { ComponentProps, useContext, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Field, Input, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { get } from 'lodash';

import { CheckFormValues } from 'types';

import { RequestFieldContext } from './RequestField';

type RequestInputProps = ComponentProps<typeof Input> & {
  'data-testid'?: string;
  placeholder?: string;
};

export const RequestInput = ({
  'data-testid': dataTestId,
  onBlur,
  onChange,
  placeholder,
  ...props
}: RequestInputProps) => {
  const styles = useStyles2(getStyles);
  const { formState, register } = useFormContext<CheckFormValues>();
  const { id, name } = useContext(RequestFieldContext);
  const [showPlaceholder, setShowplaceholder] = useState(true);
  const error = get(formState.errors, name);
  const { onBlur: fieldOnBlur, onChange: fieldOnChange, ...field } = register(name);

  return (
    <Field className={styles.field} invalid={Boolean(error)} error={error?.message}>
      <Input
        id={id}
        data-testid={dataTestId}
        placeholder={showPlaceholder ? placeholder : undefined}
        data-fs-element="Target input"
        invalid={Boolean(error)}
        onFocus={() => setShowplaceholder(false)}
        onChange={(e) => {
          fieldOnChange(e);
          onChange?.(e);
        }}
        onBlur={(e) => {
          setShowplaceholder(true);
          fieldOnBlur(e);
          onBlur?.(e);
        }}
        {...props}
        {...field}
      />
    </Field>
  );
};

const getStyles = () => ({
  field: css({
    margin: 0,
  }),
});
