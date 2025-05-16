import React, { useCallback } from 'react';
import { config } from '@grafana/runtime';
import { Icon, LinkButton, Stack, Tooltip, useStyles2 } from '@grafana/ui';

import { Check, CheckAlertError, PrometheusAlertsGroup } from 'types';

import { getStyles } from './AlertStatus';

interface AlertRuleDisplayProps {
  group: PrometheusAlertsGroup;
  alerts: Check['Alerts'];
}

export const GrafanaNamespaceAlertRuleDisplay = ({ group, alerts }: AlertRuleDisplayProps) => {
  const styles = useStyles2(getStyles);
  const { file, name, rules } = group;
  const filteredRules = rules.filter((record) => record.type === `alerting`);
  const queryParamForAlerting = encodeURIComponent(`namespace:${file} group:${name}`);

  return (
    <Stack direction="column" gap={1}>
      <Stack direction="row" gap={1} alignItems="center">
        <Icon name="grafana" />

        <div>
          <a href={`/alerting/list?search=${queryParamForAlerting}`}>
            <span>{file}</span>
            <span>{' > '}</span>
            <span>{name}</span>
          </a>
        </div>
      </Stack>
      <ul className={styles.list}>
        {filteredRules.map((rule) => {
          const alert = alerts?.find((alert) => rule.name.includes(alert.name));

          return (
            <li key={rule.name}>
              <Stack gap={1} alignItems="center" justifyContent="space-between">
                <Icon name="corner-down-right-alt" />
                <span>{rule.name}</span>
                <LinkButton
                  href={`/alerting/grafana/${rule.uid}/view`}
                  target="_blank"
                  icon="eye"
                  fill="text"
                  tooltip="View rule in Alerting"
                  size="sm"
                />
                {alert?.status && alert.status !== 'OK' && (
                  <NotOkStatusInfo status={alert.status} error={alert?.error} />
                )}
              </Stack>
            </li>
          );
        })}
      </ul>
    </Stack>
  );
};

export const NotOkStatusInfo = ({ status, error }: { status: string; error?: CheckAlertError }) => {
  const tooltipContent = useCallback(() => {
    return (
      <Stack direction="column" gap={1}>
        <span>Status: {status}</span>
        <span>Error: {error}</span>
      </Stack>
    );
  }, [status, error]);

  return error ? (
    <Tooltip content={tooltipContent()}>
      <Icon name="exclamation-triangle" color={config.theme2.colors.error.text} cursor={'pointer'} />
    </Tooltip>
  ) : null;
};
