import React from 'react';
import { TextLink } from '@grafana/ui';

import { ROUTES } from 'types';
import { t, Trans } from 'components/i18n';

import { SubsectionWelcomePage } from './SubsectionWelcomePage';

export const ChecksWelcomePage = () => {
  const BUTTON_TEXT = t(`welcome.checks.cta`, 'Create a Check');

  return (
    <SubsectionWelcomePage redirectTo={ROUTES.ChooseCheckGroup} buttonText={BUTTON_TEXT}>
      <Trans i18nKey={`welcome.checks.content`}>
        Click the {{ buttonText: BUTTON_TEXT }} button to initialize the plugin and create checks or visit the Synthetic
        Monitoring{' '}
        <TextLink href="https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/" external={true}>
          documentation
        </TextLink>{' '}
        for more information
      </Trans>
    </SubsectionWelcomePage>
  );
};
