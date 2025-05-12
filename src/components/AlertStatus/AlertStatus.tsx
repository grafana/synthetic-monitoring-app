import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, IconButton, Stack, useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { AlertSensitivity, Check, PrometheusAlertsGroup } from 'types';
import { useAlertRules, useGMAlertRules } from 'hooks/useAlertRules';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { Toggletip } from 'components/Toggletip';

import { LegacyAlertGroups } from './LegacyAlertGroups';
import { PerCheckAlertGroups } from './PerCheckAlertsGroups';

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
      hasAlertSensitivity={hasAlertSensitivity}
    />
  );
};

interface AlertStatusContentProps extends AlertStatusProps {
  metricsDSName?: string;
  hasAlertSensitivity: boolean;
}

export const AlertStatusContent = ({ check, compact, metricsDSName, hasAlertSensitivity }: AlertStatusContentProps) => {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();

  const alertRulesResponse = useAlertRules(check.alertSensitivity);
  const {
    groups: perCheckGroups,
    isLoading: perCheckGroupsLoading,
    isError: perCheckGroupsError,
    refetch: perCheckGroupsRefetch,
  } = useGMAlertRules(check.Alerts);

  const perCheckGroupsResponse = {
    perCheckGroups,
    perCheckGroupsLoading,
    perCheckGroupsError,
    perCheckGroupsRefetch,
  };

  const setUpWarning = !alertRulesResponse.isLoading && !alertRulesResponse.enabled;

  if (hasAlertSensitivity && setUpWarning) {
    const ariaLabel = `Alert configuration warning`;

    return (
      <Toggletip
        content={
          <TooltipContent
            {...alertRulesResponse}
            {...perCheckGroupsResponse}
            hasAlertSensitivity={hasAlertSensitivity}
            check={check}
            metricsDSName={metricsDSName!}
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
        <TooltipContent
          {...alertRulesResponse}
          {...perCheckGroupsResponse}
          hasAlertSensitivity={hasAlertSensitivity}
          check={check}
          metricsDSName={metricsDSName!}
        />
      }
    >
      <IconButton aria-label="Alert rules" name={`bell`} color={theme.colors.warning.border} />
    </Toggletip>
  );
};

const TooltipContent = ({
  isLoading,
  isError,
  refetch,
  perCheckGroups,
  perCheckGroupsLoading,
  perCheckGroupsError,
  perCheckGroupsRefetch,
  hasAlertSensitivity,
  check,
  metricsDSName,
  groups,
}: {
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  perCheckGroups: PrometheusAlertsGroup[];
  perCheckGroupsLoading: boolean;
  perCheckGroupsError: boolean;
  perCheckGroupsRefetch: () => void;
  hasAlertSensitivity: boolean;
  check: Check;
  metricsDSName: string;
  groups: PrometheusAlertsGroup[];
}) => {
  return (
    <Stack direction="column" gap={2}>
      <PerCheckAlertGroups
        groups={perCheckGroups}
        loading={perCheckGroupsLoading}
        isError={perCheckGroupsError}
        refetch={perCheckGroupsRefetch}
      />
      {hasAlertSensitivity && (
        <LegacyAlertGroups
          check={check}
          metricsDSName={metricsDSName!}
          isLoading={isLoading}
          groups={groups}
          isError={isError}
          refetch={refetch}
        />
      )}
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
    display: 'flex',
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
