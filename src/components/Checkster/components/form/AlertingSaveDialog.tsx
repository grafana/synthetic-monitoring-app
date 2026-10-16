import React from 'react';
import { Button, Modal, Stack, Text } from '@grafana/ui';

import { AlertingConfirmationRequired, CheckAlertingSaveError } from 'data/alertSetupRecovery';

export function AlertingSaveDialog({
  error,
  busy,
  onAction,
  onCancel,
}: {
  error: AlertingConfirmationRequired | CheckAlertingSaveError;
  busy: boolean;
  onAction: (action: () => Promise<Function | void>) => void;
  onCancel: () => void;
}) {
  const saved = error instanceof CheckAlertingSaveError;
  return (
    <Modal
      title={saved ? 'Check saved. Alerting setup is incomplete.' : 'Continue with incomplete alerting setup?'}
      isOpen
      onDismiss={saved || busy ? undefined : onCancel}
      closeOnEscape={!saved && !busy}
      closeOnBackdropClick={!saved && !busy}
    >
      <Stack direction="column" gap={2}>
        <Text>{error.message}</Text>
        {saved && (
          <Text color="secondary">
            Retry setup for this check, or continue to the check page to review its alerting status.
          </Text>
        )}
      </Stack>
      <Modal.ButtonRow>
        {saved ? (
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => onAction(async () => error.continueToCheck)}
            >
              Continue to check
            </Button>
            <Button
              type="button"
              disabled={busy}
              icon={busy ? 'spinner' : undefined}
              onClick={() => onAction(error.retry)}
            >
              Retry alerting setup
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>
              Back to setup
            </Button>
            <Button
              type="button"
              disabled={busy}
              icon={busy ? 'spinner' : undefined}
              onClick={() => onAction(error.proceed)}
            >
              Save check anyway
            </Button>
          </>
        )}
      </Modal.ButtonRow>
    </Modal>
  );
}
