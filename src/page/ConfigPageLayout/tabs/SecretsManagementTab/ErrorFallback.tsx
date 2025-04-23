import React from 'react';
import { Button, EmptyState, TextLink } from '@grafana/ui';

import { ConfigContent } from '../../ConfigContent';

export function ErrorFallback({ title = 'Error loading secret' }: { title?: string }) {
  return (
    <ConfigContent>
      <EmptyState
        variant="not-found"
        message={title}
        button={
          <Button onClick={() => window.location.reload()} icon="sync">
            Retry
          </Button>
        }
      >
        Something went wrong. Please try again later. If the problem persists, please{' '}
        <TextLink href="https://grafana.com/contact" external>
          contact support
        </TextLink>
        .
      </EmptyState>
    </ConfigContent>
  );
}
