import React from 'react';
import { EmptyState, TextLink } from '@grafana/ui';
import { DataTestIds } from 'test/dataTestIds';

import { AddNewCheckButton } from 'components/AddNewCheckButton';

interface ChecksEmptyStatePageProps {
  className?: string;
}

export function ChecksEmptyState({ className }: ChecksEmptyStatePageProps) {
  return (
    <div className={className} data-testid={DataTestIds.CHECKS_EMPTY_STATE}>
      <EmptyState
        variant="call-to-action"
        message="You haven't created any checks yet"
        button={<AddNewCheckButton source="check-list-empty-state" />}
      >
        <p>
          Create a check to start monitoring your services with Grafana Cloud, or check out the{' '}
          <TextLink external href="https://grafana.com/docs/grafana-cloud/synthetic-monitoring/">
            Synthetic Monitoring docs
          </TextLink>
          .
        </p>
      </EmptyState>
    </div>
  );
}
