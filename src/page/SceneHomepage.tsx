import React from 'react';
import { LoadingPlaceholder } from '@grafana/ui';

import { useSuspenseChecks } from 'data/useChecks';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';
import { SummaryDashboard } from 'scenes/Summary/SummaryDashboard';

function SceneHomepageComponent() {
  const { data: checks = [], isLoading } = useSuspenseChecks();

  if (isLoading) {
    return <LoadingPlaceholder text="Loading..." />;
  }

  return <SummaryDashboard checks={checks} />;
}

export function SceneHomepage() {
  return (
    <QueryErrorBoundary>
      <SceneHomepageComponent />
    </QueryErrorBoundary>
  );
}
