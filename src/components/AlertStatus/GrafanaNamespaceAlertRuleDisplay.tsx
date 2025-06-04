import React from 'react';
import { Icon, LinkButton, Stack, useStyles2 } from '@grafana/ui';

import { Check, PrometheusAlertsGroup } from 'types';

import { getStyles } from './AlertStatus';
import { NotOkStatusInfo } from './NotOkStatusInfo';

interface AlertRuleDisplayProps {
  group: PrometheusAlertsGroup;
  alerts: Check['alerts'];
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
                {rule.uid && (
                  <LinkButton
                    href={`/alerting/grafana/${rule.uid}/view`}
                    target="_blank"
                    icon="eye"
                    fill="text"
                    tooltip="View rule in Alerting"
                    size="sm"
                  />
                )}
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
