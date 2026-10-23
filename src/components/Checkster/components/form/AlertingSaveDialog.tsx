import React from 'react';
import { Button, Modal, Stack, Text } from '@grafana/ui';

export function AlertingSaveDialog({
  message,
  busy,
  onRetry,
  onContinue,
}: {
  message: string;
  busy: boolean;
  onRetry: () => void;
  onContinue: () => void;
}) {
  return (
    <Modal title="Check saved. Alerting setup is incomplete." isOpen closeOnEscape={false} closeOnBackdropClick={false}>
      <Stack direction="column" gap={2}>
        <Text>{message}</Text>
        <Text color="secondary">
          Retry setup for this check, or continue to the check page to review its alerting status.
        </Text>
      </Stack>
      <Modal.ButtonRow>
        <Button type="button" variant="secondary" disabled={busy} onClick={onContinue}>
          Continue to check
        </Button>
        <Button type="button" disabled={busy} icon={busy ? 'spinner' : undefined} onClick={onRetry}>
          Retry alerting setup
        </Button>
      </Modal.ButtonRow>
    </Modal>
  );
}
