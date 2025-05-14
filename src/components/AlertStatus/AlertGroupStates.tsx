import React from 'react';
import { Icon, IconButton, Stack, Tooltip } from '@grafana/ui';
interface AlertGroupsProps {
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export const AlertGroupStates = ({ isLoading, isError, refetch }: AlertGroupsProps) => {
  return (
    <Stack direction="column" gap={2}>
      {isLoading && (
        <Tooltip content={`Loading alert rules`}>
          <Icon name="fa fa-spinner" />
        </Tooltip>
      )}
      {isError && (
        <IconButton
          tooltip="Unable to fetch alerting rules. Retry?"
          name="exclamation-triangle"
          onClick={() => refetch()}
        />
      )}
    </Stack>
  );
};
