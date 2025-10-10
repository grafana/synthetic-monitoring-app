import React, { forwardRef, HTMLProps, useState } from 'react';
import { IconButton, Input } from '@grafana/ui';

// TODO: Move this component up the tree and use in `components/PasswordField`.

type PasswordInputProps = Omit<HTMLProps<HTMLInputElement>, 'type' | 'width'> & { width?: number };

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(props, ref) {
  const [reveal, setReveal] = useState(false);
  const inputType = reveal ? 'text' : 'password';
  const toggleIcon = reveal ? 'eye-slash' : 'eye';
  const tooltip = reveal ? 'Hide password' : 'Show password';

  const handleRevealToggle = () => setReveal(!reveal);

  return (
    <Input
      ref={ref}
      type={inputType}
      suffix={
        <IconButton
          tooltip={tooltip}
          name={toggleIcon}
          aria-controls={props.id}
          role="switch"
          aria-label="Toggle password visibility"
          onClick={handleRevealToggle}
        />
      }
      {...props}
    />
  );
});
