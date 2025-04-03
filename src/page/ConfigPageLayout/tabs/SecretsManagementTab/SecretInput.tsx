import React, { useState } from 'react';
import { Button, IconButton, Input, Stack } from '@grafana/ui';

export type Props = React.ComponentProps<typeof Input> & {
  isConfigured: boolean;
  onReset: () => void;
};

const CONFIGURED_TEXT = 'configured';
const RESET_BUTTON_TEXT = 'Reset';
const SHOW_VALUE_TEXT = 'Show value';
const HIDE_VALUE_TEXT = 'Hide value';

export function SecretInput({ isConfigured, onReset, ...props }: Props) {
  const [reveal, setReveal] = useState(false);

  return (
    <Stack>
      {!isConfigured && (
        <>
          <Input
            {...props}
            type={reveal ? 'text' : 'password'}
            autoComplete="off"
            suffix={
              <IconButton
                tooltip={reveal ? HIDE_VALUE_TEXT : SHOW_VALUE_TEXT}
                onClick={() => setReveal(!reveal)}
                aria-label={reveal ? HIDE_VALUE_TEXT : SHOW_VALUE_TEXT}
                name={reveal ? 'eye-slash' : 'eye'}
              />
            }
          />
        </>
      )}
      {isConfigured && (
        <>
          <Input type="text" disabled value={CONFIGURED_TEXT} />
          <Button onClick={onReset} variant="secondary">
            {RESET_BUTTON_TEXT}
          </Button>
        </>
      )}
    </Stack>
  );
}
