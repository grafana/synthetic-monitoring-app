import React, { useState } from 'react';
import { dateTimeFormat } from '@grafana/data';
import { Button, Stack, Text } from '@grafana/ui';

import { Toggletip } from 'components/Toggletip';

interface SuggestionsRefreshControlProps {
  generatedAt?: number;
  isFetching: boolean;
  onRefresh: () => void;
}

export function SuggestionsRefreshControl({ generatedAt, isFetching, onRefresh }: SuggestionsRefreshControlProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const refresh = () => {
    setShowConfirmation(false);
    onRefresh();
  };

  return (
    <Stack direction="row" alignItems="center" gap={1}>
      {generatedAt ? (
        <Text color="secondary" variant="bodySmall">
          <time dateTime={new Date(generatedAt).toISOString()}>Generated {dateTimeFormat(generatedAt)}</time>
        </Text>
      ) : null}
      {isFetching ? (
        <Button aria-label="Refresh suggestions" disabled icon="sync" size="sm" variant="secondary">
          Refreshing suggestions…
        </Button>
      ) : (
        <Toggletip
          content={
            <Stack direction="column" gap={2}>
              <Text element="h3" variant="h6">
                Refresh suggestions?
              </Text>
              <Text>
                This reruns the traffic analysis and replaces the current suggestions with the latest results.
              </Text>
              <div>
                <Button onClick={refresh}>Refresh suggestions</Button>
              </div>
            </Stack>
          }
          onClose={() => setShowConfirmation(false)}
          show={showConfirmation}
          strategy="fixed"
        >
          <Button
            aria-label="Refresh suggestions"
            icon="sync"
            onClick={() => setShowConfirmation(true)}
            size="sm"
            variant="secondary"
          >
            Refresh
          </Button>
        </Toggletip>
      )}
    </Stack>
  );
}
