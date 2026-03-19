import React from 'react';
import { LoadingPlaceholder, Stack } from '@grafana/ui';
import { SyntheticChecksPanel } from 'exposedComponents/SyntheticChecksPanel/SyntheticChecksPanel';

import { useSuspenseChecks } from 'data/useChecks';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';
import { SummaryDashboard } from 'scenes/Summary/SummaryDashboard';

function SceneHomepageComponent() {
  const { data: checks = [], isLoading } = useSuspenseChecks();

  if (isLoading) {
    return <LoadingPlaceholder text="Loading..." />;
  }

  return (
    <Stack direction="column" gap={2}>
      <SummaryDashboard checks={checks} />
      {/* TODO: remove — temporary preview of the exposed SyntheticChecksPanel component */}
      <SyntheticChecksPanel
        urls={['https://bdcf89.field-eng-demo.grafana.net/']}
        /* timeRange={{ from: Math.floor(Date.now() / 1000) - 60 * 60 * 24, to: Math.floor(Date.now() / 1000) }}*/
        title="Exposed component preview"
        pageSize={5}
      />
    </Stack>
  );
}

export function SceneHomepage() {
  return (
    <QueryErrorBoundary>
      <SceneHomepageComponent />
    </QueryErrorBoundary>
  );
}
