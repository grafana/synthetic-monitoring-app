import React, { forwardRef, RefObject } from 'react';
import { Button, Tooltip } from '@grafana/ui';

import { CheckType } from 'types';
import { useCanReadLogs } from 'hooks/useDSPermission';

export interface ConstructActionsProps {
  checkType: CheckType;
  disabled: boolean;
  loading: boolean;
  ref: RefObject<HTMLButtonElement | null>;
}

/**
 * Button to test a check adhoc.
 * @todo Dont use type "submit" as it will cause an "invalid" form state.
 * @todo Use "button" instead.
 */
export const AdHocCheckButton = forwardRef<HTMLButtonElement, Omit<ConstructActionsProps, 'checkType'>>(
  ({ disabled, loading }, ref) => {
    const canReadLogs = useCanReadLogs();
    const content = (
      <Button
        disabled={disabled || !canReadLogs}
        icon={loading ? `fa fa-spinner` : undefined}
        ref={ref}
        type="submit"
        variant={`secondary`}
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
