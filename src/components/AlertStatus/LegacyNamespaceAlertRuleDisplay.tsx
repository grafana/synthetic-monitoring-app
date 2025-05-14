import React from 'react';
import { Icon, LinkButton, Stack, useStyles2 } from '@grafana/ui';

import { PrometheusAlertsGroup } from 'types';

import { getStyles } from './AlertStatus';

interface AlertRuleDisplayProps {
  group: PrometheusAlertsGroup;
  metricsDSName: string;
}

export const LegacyNamespaceAlertRuleDisplay = ({ group, metricsDSName }: AlertRuleDisplayProps) => {
  const styles = useStyles2(getStyles);
  const { file, name, rules } = group;
  const filteredRules = rules.filter((record) => record.type === `alerting`);
  const queryParamForAlerting = encodeURIComponent(`datasource:${metricsDSName} namespace:${file} group:${name}`);

  return (
    <Stack direction="column" gap={1}>
      <Stack direction="row" gap={1} alignItems="center">
        <img
          alt={metricsDSName}
          className={styles.image}
          src={'/public/app/plugins/datasource/prometheus/img/prometheus_logo.svg'}
        />
        <div>
          <a href={`/alerting/list?search=${queryParamForAlerting}`}>
            <span>{file}</span>
            <span>{' > '}</span>
            <span>{name}</span>
          </a>
        </div>
      </Stack>
      <ul className={styles.list}>
        {filteredRules.map((rule) => (
          <li key={rule.name}>
            <Stack gap={1} alignItems="center" justifyContent="space-between">
              <Icon name="corner-down-right-alt" />
              <span>{rule.name}</span>
              <LinkButton
                href={`/alerting/${metricsDSName}/${rule.name}/find`}
                target="_blank"
                icon="eye"
                fill="text"
                tooltip="View rule in Alerting"
                size="sm"
              />
            </Stack>
          </li>
        ))}
      </ul>
    </Stack>
  );
};
