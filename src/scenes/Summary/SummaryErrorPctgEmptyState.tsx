import React from 'react';
import { EmptyState, TextLink } from '@grafana/ui';
import { SCENES_TEST_ID } from 'test/dataTestIds';

import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';

interface SummaryErrorPctgEmptyStateProps {
  className?: string;
}

export function SummaryErrorPctgEmptyState({ className }: SummaryErrorPctgEmptyStateProps) {
  return (
    <div className={className} data-testid={SCENES_TEST_ID.summary.errorPctgEmptyState}>
      <EmptyState variant="completed" message="No errors in this range">
        <p>Matching checks ran cleanly — an error rate of 0% is expected here.</p>
        <TextLink href={getRoute(AppRoutes.Checks)}>View matching checks</TextLink>
      </EmptyState>
    </div>
  );
}
