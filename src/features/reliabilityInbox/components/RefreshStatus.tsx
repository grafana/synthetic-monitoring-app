import React from 'react';
import { Spinner, Stack, Text } from '@grafana/ui';

import { ErrorAlert } from 'components/ErrorAlert';

interface RefreshStatusProps {
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function RefreshStatus({ isFetching, isError, onRetry }: RefreshStatusProps) {
  if (isFetching) {
    return (
      <Stack role="status" alignItems="center" gap={1}>
        <Spinner size="xs" inline />
        <Text color="secondary" variant="bodySmall">
          Showing saved suggestions · Looking for new opportunities…
        </Text>
      </Stack>
    );
  }

  if (isError) {
    return (
      <ErrorAlert
        buttonText="Retry"
        content="Showing saved suggestions. Try again later for newer opportunities."
        onClick={onRetry}
        title="Suggestions could not be refreshed"
      />
    );
  }

  return null;
}
