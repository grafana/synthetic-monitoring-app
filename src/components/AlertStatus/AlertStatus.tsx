import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, IconButton, Stack, useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { AlertSensitivity, Check, PrometheusAlertsGroup } from 'types';
import { CheckRuntimeAlertState } from 'data/useCheckAlertStates';
import { useAlertRules, useGMAlertRules } from 'hooks/useAlertRules';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { Toggletip } from 'components/Toggletip';

import { LegacyAlertGroups } from './LegacyAlertGroups';
import { PerCheckAlertGroups } from './PerCheckAlertsGroups';

interface AlertStatusProps {
  check: Check;
  compact?: boolean;
  runtimeAlertState?: CheckRuntimeAlertState;
}

export const AlertStatus = ({ check, compact, runtimeAlertState }: AlertStatusProps) => {
  const hasAlertSensitivity = check.alertSensitivity !== undefined && check.alertSensitivity !== AlertSensitivity.None;
  const hasPerCheckAlerts = (check.alerts?.length ?? 0) > 0;

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
      runtimeAlertState={runtimeAlertState}
    />
  );
};

interface AlertStatusContentProps extends AlertStatusProps {
  metricsDSName?: string;
  hasAlertSensitivity: boolean;
}

export const AlertStatusContent = ({
  check,
  compact,
  metricsDSName,
  hasAlertSensitivity,
  runtimeAlertState,
}: AlertStatusContentProps) => {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const isFiring = (runtimeAlertState?.firingCount ?? 0) > 0;
  const firingAlertNames = runtimeAlertState?.firingAlertNames ?? new Set<string>();

  const alertRulesResponse = useAlertRules(check.alertSensitivity);
  const {
    groups: perCheckGroups,
    isLoading: perCheckGroupsLoading,
    isError: perCheckGroupsError,
    refetch: perCheckGroupsRefetch,
  } = useGMAlertRules(check.alerts);

  const perCheckGroupsResponse = {
    perCheckGroups,
    perCheckGroupsLoading,
    perCheckGroupsError,
    perCheckGroupsRefetch,
  };

  const tooltipContent = (
    <TooltipContent
      {...alertRulesResponse}
      {...perCheckGroupsResponse}
      hasAlertSensitivity={hasAlertSensitivity}
      check={check}
      metricsDSName={metricsDSName!}
      firingAlertNames={firingAlertNames}
    />
  );

  const setUpWarning = !alertRulesResponse.isLoading && !alertRulesResponse.enabled;

  if (hasAlertSensitivity && setUpWarning) {
    const ariaLabel = `Alert configuration warning`;

    return (
      <Toggletip content={tooltipContent}>
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

  if (isFiring) {
    const firingCount = runtimeAlertState!.firingCount;
    const firingText = firingCount === 1 ? 'Alert firing' : `${firingCount} alerts firing`;
    const ariaLabel = firingText;

    return (
      <Toggletip content={tooltipContent}>
        <button aria-label={ariaLabel} className={styles.firingButton}>
          <Icon name="bell" size="sm" />
          <span>{firingText}</span>
        </button>
      </Toggletip>
    );
  }

  return (
    <Toggletip content={tooltipContent}>
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
  firingAlertNames,
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
  firingAlertNames: Set<string>;
}) => {
  return (
    <Stack direction="column" gap={2}>
      <PerCheckAlertGroups
        alerts={check.alerts}
        groups={perCheckGroups}
        loading={perCheckGroupsLoading}
        isError={perCheckGroupsError}
        refetch={perCheckGroupsRefetch}
        firingAlertNames={firingAlertNames}
      />
      {hasAlertSensitivity && (
        <LegacyAlertGroups
          check={check}
          metricsDSName={metricsDSName!}
          isLoading={isLoading}
          groups={groups}
          isError={isError}
          refetch={refetch}
          firingAlertNames={firingAlertNames}
        />
      )}
    </Stack>
  );
};

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
  firingButton: css({
    background: `transparent`,
    border: `1px solid ${theme.colors.error.border}`,
    borderRadius: theme.shape.radius.pill,
    padding: theme.spacing(0.5, 1),
    display: `flex`,
    alignItems: `center`,
    gap: theme.spacing(0.5),
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.error.text,
    cursor: 'pointer',
    transition: `background-color 0.2s ease`,
  }),
  image: css({
    height: theme.spacing(2),
    width: theme.spacing(2),
  }),
  list: css({
    display: 'flex',
    listStyle: 'none',
  }),
  warningIcon: css({
    color: theme.colors.warning.text,
  }),
});
