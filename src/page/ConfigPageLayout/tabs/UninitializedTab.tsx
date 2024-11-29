import React from 'react';
import { EmptyState, TextLink } from '@grafana/ui';

import { ROUTES } from 'routing/types';
import { AppInitializer } from 'components/AppInitializer';

import { ConfigContent } from '../ConfigContent';

export function UninitializedTab() {
  // For some reason the 'call-to-action' variant causes infinity loop in the test (if the image is shown)
  const hideImage = process.env.NODE_ENV === 'test';

  return (
    <ConfigContent title="Requires initialization">
      <EmptyState
        hideImage={hideImage}
        variant="call-to-action"
        message="Synthetic Monitoring is not yet initialized"
        button={<AppInitializer redirectTo={ROUTES.Config} buttonText="Initialize plugin" />}
      >
        <p>
          The plugin is installed and enabled but still requires initialization. Click the button below to get started
          or take a look at the{' '}
          <TextLink external href="https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/">
            documentation
          </TextLink>
          .
        </p>
      </EmptyState>
    </ConfigContent>
  );
}
