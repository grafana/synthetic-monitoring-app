import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, LinkButton, Stack } from '@grafana/ui';
import { css } from '@emotion/css';

import { AlertSensitivity } from 'types';
import { ROUTES } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { useCheckDrilldown } from 'page/CheckDrilldown/components/CheckDrilldownContext';
import { Info } from 'page/CheckDrilldown/components/Info';
import { AlertStatus } from 'page/CheckList/components/AlertStatus';

export const InfoAlerts = () => {
  const { check } = useCheckDrilldown();
  const alerts = check.alerts;
  const alertSensitivity = check.alertSensitivity;
  const hasAlertSensitivity = alertSensitivity !== undefined && alertSensitivity !== AlertSensitivity.None;
  const hasAlerts = alerts !== undefined && Object.keys(alerts).length > 0;

  return (
    <>
      {hasAlertSensitivity || hasAlerts ? (
        <>
          {hasAlertSensitivity && (
            <Info label="Alert sensitivity">
              <Stack direction="row" alignItems="center">
                <div>{check.alertSensitivity}</div>
                <AlertStatus check={check} />
              </Stack>
            </Info>
          )}
          {hasAlerts && (
            <Info label="Alerts">
              {Object.keys(alerts).map((alert) => (
                <div key={alert}>{alert}</div>
              ))}
            </Info>
          )}
        </>
      ) : (
        <Alert title="No alerts associated with this check" severity="warning">
          <Stack direction="column" gap={2}>
            <div>Set alerting for your check to receive notifications when the check is unhealthy.</div>
            <div>
              <LinkButton href={generateRoutePath(ROUTES.EditCheck, { id: check.id! })}>Set alerts</LinkButton>
            </div>
          </Stack>
        </Alert>
      )}
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(3)};
    `,
  };
};
