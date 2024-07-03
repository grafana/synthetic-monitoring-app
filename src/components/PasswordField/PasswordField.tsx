import React, { forwardRef, HTMLProps, useState } from 'react';
import { Field, IconButton, Input } from '@grafana/ui';

interface PasswordFieldProps extends Omit<HTMLProps<HTMLInputElement>, 'width'> {
  description?: string;
  invalid?: boolean;
  error?: string;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ id, label, description, placeholder, disabled, invalid, error, required, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <Field
        htmlFor={id}
        disabled={Boolean(disabled)}
        invalid={Boolean(invalid)}
        label={label}
        description={description}
        error={error}
        required={required}
      >
        <Input
          {...props}
          ref={ref}
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          disabled={disabled}
          suffix={
            <IconButton
              name={showPassword ? 'eye-slash' : 'eye'}
              aria-controls={id}
              role="switch"
              aria-checked={showPassword}
              onClick={() => {
                setShowPassword(!showPassword);
              }}
              tooltip={showPassword ? 'Hide password' : 'Show password'}
            />
          }
        />
      </Field>
    );
  }
);

PasswordField.displayName = 'PasswordField';
