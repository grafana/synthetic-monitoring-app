import React from 'react';
import { TextLink } from '@grafana/ui';

import { AppRoutes } from 'routing/types';

import { SubsectionWelcomePage } from './SubsectionWelcomePage';

export const ProbesWelcomePage = () => {
  const BUTTON_TEXT = 'See Probes';

  return (
    <SubsectionWelcomePage redirectTo={AppRoutes.Probes} buttonText={BUTTON_TEXT}>
      Click the {BUTTON_TEXT} button to initialize the plugin and see a list of public probes or visit the Synthetic
      Monitoring{' '}
      <TextLink href="https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/" external={true}>
        documentation
      </TextLink>{' '}
      for more information
    </SubsectionWelcomePage>
  );
};
