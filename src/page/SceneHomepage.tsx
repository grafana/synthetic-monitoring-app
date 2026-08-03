import React from 'react';
import { LoadingPlaceholder } from '@grafana/ui';

import { useSuspenseChecks } from 'data/useChecks';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';
import { SummaryDashboard } from 'scenes/Summary/SummaryDashboard';

// TEMPORARY: reliability-inbox debug panel. To remove the experiment from the UI,
// delete this import, the element below, and ReliabilityInboxDebug.tsx.
import { ReliabilityInboxDebug } from './ReliabilityInboxDebug';

function SceneHomepageComponent() {
  const { data: checks = [], isLoading } = useSuspenseChecks();

  if (isLoading) {
    return <LoadingPlaceholder text="Loading..." />;
  }

  return (
    <>
      <ReliabilityInboxDebug />
      <SummaryDashboard checks={checks} />
    </>
  );
}

export function SceneHomepage() {
  return (
    <QueryErrorBoundary>
      <SceneHomepageComponent />
    </QueryErrorBoundary>
  );
}
