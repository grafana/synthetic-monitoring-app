import React from 'react';
import { Button, Input, Stack, TextArea } from '@grafana/ui';

export type Props = React.ComponentProps<typeof TextArea> & {
  isConfigured: boolean;
  onReset: () => void;
};

const CONFIGURED_TEXT = 'configured';
const RESET_BUTTON_TEXT = 'Reset';

export function SecretInput({ isConfigured, onReset, ...props }: Props) {
  return (
    <Stack>
      {!isConfigured && (
        <>
          <TextArea rows={5} id="secret-value" disabled={isConfigured} {...props} />
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
