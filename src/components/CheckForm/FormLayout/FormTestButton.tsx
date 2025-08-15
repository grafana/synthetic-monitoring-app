import React, { PropsWithChildren, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button, Tooltip } from '@grafana/ui';

import { CheckFormValues } from '../../../types';

import { useCanReadLogs } from '../../../hooks/useDSPermission';
import { useRunAdhocCheck } from '../CheckForm.hooks';
import { useCheckFormContext } from '../CheckFormContext/CheckFormContext';

function ConditionalTooltip({ children, canReadLogs }: PropsWithChildren<{ canReadLogs: boolean }>) {
  if (canReadLogs) {
    return <>{children}</>;
  }

  return <Tooltip content="You need permission to read logs to test checks.">{children}</Tooltip>;
}

export function FormTestButton({ children = 'Test' }: PropsWithChildren) {
  const [runAdhocCheck, error] = useRunAdhocCheck();
  const { setShowAdhocTestModal, setAdhocTestData, setAdhocTestError } = useCheckFormContext();
  const canReadLogs = useCanReadLogs();

  const {
    formState: { disabled },
  } = useFormContext<CheckFormValues>();

  useEffect(() => {
    setAdhocTestError(error ?? null);
  }, [error, setAdhocTestError]);

  return (
    <ConditionalTooltip canReadLogs={canReadLogs}>
      <Button
        disabled={disabled || !canReadLogs}
        variant="secondary"
        onClick={() =>
          runAdhocCheck((testData) => {
            setAdhocTestData(testData);
            setShowAdhocTestModal(true);
          })
        }
      >
        {children}
      </Button>
    </ConditionalTooltip>
  );
}
