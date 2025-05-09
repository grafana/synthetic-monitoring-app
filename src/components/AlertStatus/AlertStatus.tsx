import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, IconButton, Stack, Tooltip, useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { AlertSensitivity, Check, PrometheusAlertsGroup } from 'types';
import { useAlertRules } from 'hooks/useAlertRules';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { Toggletip } from 'components/Toggletip';

import { LegacyAlertGroups } from './LegacyAlertGroups';
import { PerCheckAlerts } from './PerCheckAlerts';

interface AlertStatusProps {
  check: Check;
  compact?: boolean;
}

export const AlertStatus = ({ check, compact }: AlertStatusProps) => {
  const hasAlertSensitivity = check.alertSensitivity !== undefined && check.alertSensitivity !== AlertSensitivity.None;
  const hasPerCheckAlerts = (check.Alerts?.length ?? 0) > 0;

  const metricsDS = useMetricsDS();

  if ((!hasAlertSensitivity || !metricsDS) && !hasPerCheckAlerts) {
    return null;
  }

  return (
    <AlertStatusContent
      check={check}
      compact={compact}
      metricsDSName={metricsDS?.name}
      hasPerCheckAlerts={hasPerCheckAlerts}
      hasAlertSensitivity={hasAlertSensitivity}
    />
  );
};

interface AlertStatusContentProps extends AlertStatusProps {
  metricsDSName?: string;
  hasPerCheckAlerts: boolean;
  hasAlertSensitivity: boolean;
}

export const AlertStatusContent = ({
  check,
  compact,
  metricsDSName,
  hasPerCheckAlerts,
  hasAlertSensitivity,
}: AlertStatusContentProps) => {
  const { alertSensitivity } = check;
  const { groups, isLoading, enabled, isError, refetch } = useAlertRules(alertSensitivity);
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const setUpWarning = !isLoading && !enabled;

  if (hasAlertSensitivity && isError) {
    return (
      <IconButton
        tooltip="Unable to fetch alerting rules. Retry?"
        name="exclamation-triangle"
        onClick={() => refetch()}
      />
    );
  }

  if (hasAlertSensitivity && isLoading) {
    return (
      <Tooltip content={`Loading alert rules`}>
        <Icon name="fa fa-spinner" />
      </Tooltip>
    );
  }

  if (hasAlertSensitivity && setUpWarning) {
    const ariaLabel = `Alert configuration warning`;

    return (
      <Toggletip
        content={
          <AlertGroups
            groups={groups}
            check={check}
            metricsDSName={metricsDSName!}
            hasPerCheckAlerts={hasPerCheckAlerts}
            hasAlertSensitivity={hasAlertSensitivity}
          />
        }
      >
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
    <Toggletip
      content={
        <AlertGroups
          groups={groups}
          check={check}
          metricsDSName={metricsDSName!}
          hasPerCheckAlerts={hasPerCheckAlerts}
          hasAlertSensitivity={hasAlertSensitivity}
        />
      }
    >
      <IconButton aria-label="Alert rules" name={`bell`} color={theme.colors.warning.border} />
    </Toggletip>
  );
};

interface AlertRulesProps {
  groups: PrometheusAlertsGroup[];
  check: Check;
  metricsDSName: string;
  hasPerCheckAlerts: boolean;
  hasAlertSensitivity: boolean;
}

const AlertGroups = ({ check, groups, metricsDSName, hasPerCheckAlerts, hasAlertSensitivity }: AlertRulesProps) => {
  return (
    <Stack direction="column" gap={2}>
      <PerCheckAlerts alerts={check.Alerts} />
      {hasAlertSensitivity && <LegacyAlertGroups check={check} groups={groups} metricsDSName={metricsDSName} />}
    </Stack>
  );
};

const headingDisplay = `h5`;

export const getStyles = (theme: GrafanaTheme2) => ({
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
