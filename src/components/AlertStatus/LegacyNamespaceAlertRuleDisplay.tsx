import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, LinkButton, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { PrometheusAlertsGroup } from 'types';

import { getStyles } from './AlertStatus';

interface AlertRuleDisplayProps {
  group: PrometheusAlertsGroup;
  metricsDSName: string;
  firingAlertNames: Set<string>;
}

export const LegacyNamespaceAlertRuleDisplay = ({ group, metricsDSName, firingAlertNames }: AlertRuleDisplayProps) => {
  const styles = useStyles2(getStyles);
  const ruleStyles = useStyles2(getRuleStyles);
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
        {filteredRules.map((rule) => {
          const isFiring = firingAlertNames.has(rule.name);

          return (
            <li key={rule.name}>
              <Stack gap={1} alignItems="center" justifyContent="space-between">
                <Icon name="corner-down-right-alt" />
                <span>{rule.name}</span>
                {isFiring && (
                  <span className={ruleStyles.firingIndicator}>
                    <Icon name="exclamation-circle" size="sm" />
                    <span>🔥</span>
                  </span>
                )}
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
          );
        })}
      </ul>
    </Stack>
  );
};

const getRuleStyles = (theme: GrafanaTheme2) => ({
  firingIndicator: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    color: theme.colors.error.text,
  }),
});
