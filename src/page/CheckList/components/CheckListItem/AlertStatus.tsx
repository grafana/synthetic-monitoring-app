import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, IconButton, LinkButton, Tooltip, useStyles2, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { AlertSensitivity, Check, PrometheusAlertsGroup, ROUTES } from 'types';
import { getRoute } from 'routing/utils';
import { useAlertRules } from 'hooks/useAlertRules';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { Toggletip } from 'components/Toggletip';
import { AlertSensitivityBadge } from 'page/CheckList/components/CheckListItem/AlertSensitivityBadge';

type AlertStatusProps = {
  check: Check;
  compact?: boolean;
};

export const AlertStatus = ({ check, compact }: AlertStatusProps) => {
  const hasAlertSensitivity = check.alertSensitivity !== undefined && check.alertSensitivity !== AlertSensitivity.None;
  const metricsDS = useMetricsDS();

  if (!hasAlertSensitivity || !metricsDS) {
    return null;
  }

  return <AlertStatusContent check={check} compact={compact} metricsDSName={metricsDS.name} />;
};

type AlertStatusContentProps = AlertStatusProps & {
  metricsDSName: string;
};

export const AlertStatusContent = ({ check, compact, metricsDSName }: AlertStatusContentProps) => {
  const { alertSensitivity } = check;
  const { groups, isLoading, enabled, isError, refetch } = useAlertRules(alertSensitivity);
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const setUpWarning = !isLoading && !enabled;

  if (isError) {
    return (
      <IconButton
        tooltip="Unable to fetch alerting rules. Retry?"
        name="exclamation-triangle"
        onClick={() => refetch()}
      />
    );
  }

  if (isLoading) {
    return (
      <Tooltip content={`Loading alert rules`}>
        <Icon name="fa fa-spinner" />
      </Tooltip>
    );
  }

  if (setUpWarning) {
    const ariaLabel = `Alert configuration warning`;

    return (
      <Toggletip content={<AlertGroups groups={groups} check={check} metricsDSName={metricsDSName} />}>
        {compact ? (
          <IconButton aria-label={ariaLabel} className={styles.warningIcon} name="exclamation-triangle" />
        ) : (
          <button aria-label={ariaLabel} className={styles.button}>
            <Icon className={styles.warningIcon} name="exclamation-triangle" />
            <span>Alert configuration</span>
          </button>
        )}
      </Toggletip>
    );
  }

  return (
    <Toggletip content={<AlertGroups groups={groups} check={check} metricsDSName={metricsDSName} />}>
      <IconButton aria-label="Alert rules" name={`bell`} color={theme.colors.warning.border} />
    </Toggletip>
  );
};

type AlertRulesProps = {
  groups: PrometheusAlertsGroup[];
  check: Check;
  metricsDSName: string;
};

const AlertGroups = ({ check, groups, metricsDSName }: AlertRulesProps) => {
  const hasGroups = groups.length > 0;
  const styles = useStyles2(getStyles);

  return (
    <div className={cx(styles.stackCol, styles.gap2)}>
      <h3 className={styles.title}>Alert rules</h3>
      {hasGroups ? (
        groups.map((group) => {
          const id = `${group.file}-${group.name}`;

          return <NamespaceAlertRuleDisplay key={id} group={group} metricsDSName={metricsDSName} />;
        })
      ) : (
        <ZeroStateAlerts alertSensitivity={check.alertSensitivity} />
      )}
    </div>
  );
};

type AlertRuleDisplayProps = {
  group: PrometheusAlertsGroup;
  metricsDSName: string;
};

const NamespaceAlertRuleDisplay = ({ group, metricsDSName }: AlertRuleDisplayProps) => {
  const styles = useStyles2(getStyles);
  const { file, name, rules } = group;
  const filteredRules = rules.filter((record) => record.type === `alerting`);
  const queryParamForAlerting = encodeURIComponent(`datasource:${metricsDSName} namespace:${file} group:${name}`);

  return (
    <div className={styles.stackCol}>
      <div className={styles.stack}>
        <Tooltip content={metricsDSName}>
          <img
            alt={metricsDSName}
            className={styles.image}
            src="/public/app/plugins/datasource/prometheus/img/prometheus_logo.svg"
          />
        </Tooltip>
        <div>
          <a href={`/alerting/list?search=${queryParamForAlerting}`}>
            <span>{file}</span>
            <Icon name="angle-right" />
            <span>{name}</span>
          </a>
        </div>
      </div>

      <ul className={styles.list}>
        {filteredRules.map((rule) => {
          return (
            <li className={cx(styles.stack, styles.spaceBetween)} key={rule.name}>
              <Icon name="corner-down-right-alt" />
              <span>{rule.name}</span>
              <LinkButton
                href={`/alerting/${metricsDSName}/${rule.name}/find`}
                icon="eye"
                fill="text"
                tooltip="View rule in Alerting"
                size="sm"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};

type ZeroStateAlertsProps = {
  alertSensitivity: Check['alertSensitivity'];
};

export const ZeroStateAlerts = ({ alertSensitivity }: ZeroStateAlertsProps) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={cx(styles.stackCol, styles.gap2)}>
      <div>
        This check has an alert sensitivity of
        <span className={styles.badgeWrapper}>
          <AlertSensitivityBadge alertSensitivity={alertSensitivity} />
        </span>
        but we could not detect any associated alerting rules.
      </div>
      <div>
        <LinkButton href={getRoute(ROUTES.Alerts)} size="sm">
          Go to Alerts
        </LinkButton>
      </div>
    </div>
  );
};

const headingDisplay = `h5`;

const getStyles = (theme: GrafanaTheme2) => ({
  disabled: css({
    color: theme.colors.warning.main,
  }),
  badgeWrapper: css({
    margin: theme.spacing(0, 0.5),
    position: `relative`,
    top: `2px`,
  }),
  button: css({
    background: `transparent`,
    border: `1px solid ${theme.colors.warning.border}`,
    borderRadius: theme.shape.radius.pill,
    padding: theme.spacing(0.5, 1),
    display: `flex`,
    alignItems: `center`,
    gap: theme.spacing(1),
    fontSize: theme.typography.bodySmall.fontSize,
    transition: `background-color 0.2s ease`,

    '&:hover': {
      background: theme.colors.secondary.transparent,
    },
  }),
  image: css({
    height: theme.spacing(2),
    width: theme.spacing(2),
  }),
  list: css({
    listStyle: 'none',
  }),
  stack: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),
  stackCol: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
  gap2: css({
    gap: theme.spacing(2),
  }),
  spaceBetween: css({
    justifyContent: 'space-between',
  }),
  title: css({
    fontSize: theme.typography[headingDisplay].fontSize,
    fontWeight: theme.typography[headingDisplay].fontWeight,
    lineHeight: theme.typography[headingDisplay].lineHeight,
    margin: `0`,
  }),
  warningIcon: css({
    color: theme.colors.warning.text,
  }),
});
