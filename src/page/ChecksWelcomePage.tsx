import React from 'react';
import { TextLink } from '@grafana/ui';

import { ROUTES } from 'types';

import { SubsectionWelcomePage } from './SubsectionWelcomePage';

export const ChecksWelcomePage = () => {
  const BUTTON_TEXT = 'Create a Check';

  return (
    <SubsectionWelcomePage redirectTo={ROUTES.ChooseCheckType} buttonText={BUTTON_TEXT}>
      Click the {BUTTON_TEXT} button to initialize the plugin and create checks or visit the Synthetic Monitoring{' '}
      <TextLink href="https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/" external={true}>
        documentation
      </TextLink>{' '}
      for more information
    </SubsectionWelcomePage>
  );
};
