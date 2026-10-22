import React from 'react';
import { Alert, Button, Stack } from '@grafana/ui';

import { CheckAlertingSaveError } from 'data/alertSetupRecovery';

import { TemplateCheckSaveState } from './useSaveTemplateCheck';

export function TemplateSaveControls({
  state,
  disabled,
  onCancel,
}: {
  state: TemplateCheckSaveState;
  disabled: boolean;
  onCancel: () => void;
}) {
  const { error, busy, createdCheck } = state;
  return (
    <>
      {error instanceof CheckAlertingSaveError ? (
        <Alert title="Check created, but alerting setup is incomplete" severity="warning" bottomSpacing={0}>
          {error.message}
        </Alert>
      ) : error ? (
        <Alert title="Unable to create check" severity="error" bottomSpacing={0}>
          {error instanceof Error ? error.message : 'Please try again.'}
        </Alert>
      ) : null}
      <Stack gap={1}>
        {createdCheck && error instanceof CheckAlertingSaveError ? (
          <>
            <Button type="button" disabled={busy} onClick={state.retryAlerting}>
              Retry alerting setup
            </Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={error.continueToCheck}>
              View check
            </Button>
          </>
        ) : (
          <>
            <Button type="submit" disabled={disabled || busy || !!createdCheck} icon={busy ? 'spinner' : undefined}>
              Create check
            </Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>
              Cancel
            </Button>
          </>
        )}
      </Stack>
    </>
  );
}
