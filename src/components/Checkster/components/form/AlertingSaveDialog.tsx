import React from 'react';
import { Button, Modal, Stack, Text } from '@grafana/ui';

import { CheckAlertingSaveError } from 'data/alertSetupRecovery';

export function AlertingSaveDialog({
  error,
  busy,
  onAction,
}: {
  error: CheckAlertingSaveError;
  busy: boolean;
  onAction: (action: () => Promise<Function | void>) => void;
}) {
  return (
    <Modal title="Check saved. Alerting setup is incomplete." isOpen closeOnEscape={false} closeOnBackdropClick={false}>
      <Stack direction="column" gap={2}>
        <Text>{error.message}</Text>
        <Text color="secondary">
          Retry setup for this check, or continue to the check page to review its alerting status.
        </Text>
      </Stack>
      <Modal.ButtonRow>
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => onAction(async () => error.continueToCheck)}
        >
          Continue to check
        </Button>
        <Button type="button" disabled={busy} icon={busy ? 'spinner' : undefined} onClick={() => onAction(error.retry)}>
          Retry alerting setup
        </Button>
      </Modal.ButtonRow>
    </Modal>
  );
}
