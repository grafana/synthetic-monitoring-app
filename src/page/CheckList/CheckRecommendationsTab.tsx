import React from 'react';
import { EmptyState } from '@grafana/ui';
import { CHECKS_TEST_ID } from 'test/dataTestIds';

export function CheckRecommendationsTab() {
  return (
    <div data-testid={CHECKS_TEST_ID.recommendations}>
      <EmptyState variant="completed" message="No recommendations yet">
        Recommended checks will show up here.
      </EmptyState>
    </div>
  );
}
