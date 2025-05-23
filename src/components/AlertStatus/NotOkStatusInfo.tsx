import React, { useCallback } from 'react';
import { config } from '@grafana/runtime';
import { Icon, Stack, Tooltip } from '@grafana/ui';

import { CheckAlertError } from 'types';

export const NotOkStatusInfo = ({ status, error }: { status: string; error?: CheckAlertError }) => {
  const tooltipContent = useCallback(() => {
    return (
      <Stack direction="column" gap={1}>
        <span>Status: {status}</span>
        {error && <span>Error: {error}</span>}
      </Stack>
    );
  }, [status, error]);

  return status !== 'OK' ? (
    <Tooltip content={tooltipContent()}>
      <Icon name="exclamation-circle" color={config.theme2.colors.error.text} cursor={'pointer'} />
    </Tooltip>
  ) : null;
}; 
