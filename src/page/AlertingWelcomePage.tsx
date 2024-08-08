import React from 'react';
import { TextLink } from '@grafana/ui';

import { ROUTES } from 'types';
import { t, Trans } from 'components/i18n';

import { SubsectionWelcomePage } from './SubsectionWelcomePage';

export const AlertingWelcomePage = () => {
  const BUTTON_TEXT = t(`welcome.alerts.cta`, 'See Alerting');

  return (
    <SubsectionWelcomePage redirectTo={ROUTES.Alerts} buttonText={BUTTON_TEXT}>
      <Trans i18nKey={`welcome.alerts.content`}>
        Click the {{ buttonText: BUTTON_TEXT }} button to initialize the plugin and see a list of default alerts or
        visit the Synthetic Monitoring{' '}
        <TextLink href="https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/" external={true}>
          documentation
        </TextLink>{' '}
        for more information
      </Trans>
    </SubsectionWelcomePage>
  );
};
