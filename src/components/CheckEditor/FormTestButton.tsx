import React, { PropsWithChildren, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button, Tooltip } from '@grafana/ui';

import { CheckFormValues } from 'types';
import { useCanReadLogs } from 'hooks/useDSPermission';

import { useRunAdhocCheck } from './CheckEditor.hooks';
import { useCheckEditorContext } from './CheckEditorContext';

function ConditionalTooltip({ children, canReadLogs }: PropsWithChildren<{ canReadLogs: boolean }>) {
  if (canReadLogs) {
    return <>{children}</>;
  }

  return <Tooltip content="You need permission to read logs to test checks.">{children}</Tooltip>;
}

export function FormTestButton({ children = 'Test' }: PropsWithChildren) {
  const [runAdhocCheck, error] = useRunAdhocCheck();
  const { setAdhocCheckResponse, setAdhocCheckResponseError } = useCheckEditorContext();
  const canReadLogs = useCanReadLogs();

  const {
    formState: { disabled },
  } = useFormContext<CheckFormValues>();

  useEffect(() => {
    setAdhocCheckResponseError(error ?? null);
  }, [error, setAdhocCheckResponseError]);

  return (
    <ConditionalTooltip canReadLogs={canReadLogs}>
      <Button
        disabled={disabled || !canReadLogs}
        variant="secondary"
        onClick={() =>
          runAdhocCheck((testData) => {
            setAdhocCheckResponse(testData);
          })
        }
      >
        {children}
      </Button>
    </ConditionalTooltip>
  );
}
