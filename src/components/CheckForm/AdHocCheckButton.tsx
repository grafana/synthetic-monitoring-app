import React, { forwardRef, RefObject } from 'react';
import { Button, Tooltip } from '@grafana/ui';

import { CheckType } from 'types';
import { useCanReadLogs } from 'hooks/useDSPermission';

export interface ConstructActionsProps {
  checkType: CheckType;
  disabled: boolean;
  loading: boolean;
  onClick: (() => Promise<void>) | (() => void);
  ref: RefObject<HTMLButtonElement | null>;
}

/**
 * Button to test a check adhoc.
 */
export const AdHocCheckButton = forwardRef<HTMLButtonElement, Omit<ConstructActionsProps, 'checkType'>>(
  ({ disabled, loading, onClick }, ref) => {
    const canReadLogs = useCanReadLogs();
    const content = (
      <Button
        disabled={disabled || !canReadLogs}
        icon={loading ? `fa fa-spinner` : undefined}
        ref={ref}
        variant={`secondary`}
        onClick={onClick}
      >
        Test
      </Button>
    );

    if (!canReadLogs) {
      return (
        <Tooltip content="You need permission to read logs to test checks.">
          <span>{content}</span>
        </Tooltip>
      );
    }

    return content;
  }
);

AdHocCheckButton.displayName = `AdHocCheckButton`;
