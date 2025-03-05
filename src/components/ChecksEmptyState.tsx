import React from 'react';
import { Button, EmptyState, TextLink } from '@grafana/ui';
import { DataTestIds } from 'test/dataTestIds';

import { ROUTES } from 'routing/types';
import { useNavigation } from 'hooks/useNavigation';

interface ChecksEmptyStatePageProps {
  className?: string;
}

export function ChecksEmptyState({ className }: ChecksEmptyStatePageProps) {
  const navigate = useNavigation();
  const handleCallToAction = () => navigate(ROUTES.ChooseCheckGroup);

  return (
    <div className={className} data-testid={DataTestIds.CHECKS_EMPTY_STATE}>
      <EmptyState
        variant="call-to-action"
        message="You haven't created any checks yet"
        button={
          <Button onClick={handleCallToAction} icon="plus">
            Create check
          </Button>
        }
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
