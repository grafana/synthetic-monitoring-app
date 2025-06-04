import React from 'react';
import { LinkButton, Stack, useStyles2 } from '@grafana/ui';

import { Check } from 'types';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';
import { AlertSensitivityBadge } from 'page/CheckList/components/AlertSensitivityBadge';

import { getStyles } from './AlertStatus';

interface ZeroStateAlertsProps {
  alertSensitivity: Check['alertSensitivity'];
}

export const ZeroStateAlerts = ({ alertSensitivity }: ZeroStateAlertsProps) => {
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={2}>
      <div>
        This check has an alert sensitivity of
        <span className={styles.badgeWrapper}>
          <AlertSensitivityBadge alertSensitivity={alertSensitivity} />
        </span>
        but we could not detect any associated alerting rules.
      </div>
      <div>
        <LinkButton href={getRoute(AppRoutes.Alerts)} size="sm">
          Go to Alerts
        </LinkButton>
      </div>
    </Stack>
  );
};
