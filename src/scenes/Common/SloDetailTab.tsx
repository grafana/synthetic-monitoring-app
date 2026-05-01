import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import {
  Badge,
  Button,
  Icon,
  LinkButton,
  LoadingPlaceholder,
  Stack,
  Text,
  Tooltip,
  useStyles2,
  useTheme2,
} from '@grafana/ui';
import { css } from '@emotion/css';

import type { Slo } from './useSmCheckSlos.types';

import { useSloMetrics } from './SloDetailTab.hooks';

export type SloDetailTabProps = {
  slo: Slo;
  onEdit?: (slo: Slo) => void;
};

function formatObjectivePercent(value: number): string {
  return `${(value * 100).toLocaleString(undefined, { maximumFractionDigits: 3 })}%`;
}

function formatSliPercent(value: number): string {
  return `${(value * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function formatErrorBudget(value: number): string {
  return `${(value * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function formatBurnRate(value: number): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type StatCardProps = {
  title: string;
  tooltip?: string;
  value: number | null;
  format: (value: number) => string;
  isLoading: boolean;
  getColor: (value: number, theme: GrafanaTheme2) => string;
};

function StatCard({ title, tooltip, value, format, isLoading, getColor }: StatCardProps) {
  const styles = useStyles2(getStatCardStyles);
  const theme = useTheme2();

  const displayValue = isLoading ? null : value;
  const color = displayValue !== null ? getColor(displayValue, theme) : theme.colors.text.secondary;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <Text variant="bodySmall" color="secondary">
          {title}
        </Text>
        {tooltip ? (
          <Tooltip content={tooltip}>
            <Icon name="info-circle" size="sm" />
          </Tooltip>
        ) : null}
      </div>
      <div className={styles.cardValue}>
        {isLoading ? (
          <LoadingPlaceholder text="" />
        ) : displayValue !== null ? (
          <span style={{ color }}>{format(displayValue)}</span>
        ) : (
          <Text color="secondary">No data</Text>
        )}
      </div>
    </div>
  );
}

function getSliColor(value: number, theme: GrafanaTheme2): string {
  if (value >= 0.995) {
    return theme.colors.success.text;
  }
  if (value >= 0.99) {
    return theme.colors.warning.text;
  }
  return theme.colors.error.text;
}

function getErrorBudgetColor(value: number, theme: GrafanaTheme2): string {
  if (value > 0) {
    return theme.colors.success.text;
  }
  if (value === 0) {
    return theme.colors.warning.text;
  }
  return theme.colors.error.text;
}

function getBurnRateColor(value: number, theme: GrafanaTheme2): string {
  if (value <= 1) {
    return theme.colors.success.text;
  }
  if (value <= 2) {
    return theme.colors.warning.text;
  }
  return theme.colors.error.text;
}

export function SloDetailTab({ slo, onEdit }: SloDetailTabProps) {
  const styles = useStyles2(getStyles);
  const metrics = useSloMetrics(slo);
  const primaryObjective = slo.objectives[0];
  const dashboardUid = slo.readOnly?.drillDownDashboardRef?.UID;
  const dashboardHref = dashboardUid ? `${config.appSubUrl ?? ''}/d/${dashboardUid}` : undefined;
  const window = primaryObjective?.window ?? '28d';

  return (
    <Stack direction="column" gap={2}>
      {slo.description ? (
        <Text variant="body" color="secondary">
          {slo.description}
        </Text>
      ) : null}

      {primaryObjective ? (
        <Text variant="body">
          Target: <strong>{formatObjectivePercent(primaryObjective.value)}</strong> · Window:{' '}
          <strong>{primaryObjective.window}</strong>
        </Text>
      ) : null}

      <div className={styles.statsGrid}>
        <StatCard
          title={`${window} SLI`}
          tooltip="Service Level Indicator over the objective window"
          value={metrics.sli}
          format={formatSliPercent}
          isLoading={metrics.isLoading}
          getColor={getSliColor}
        />
        <StatCard
          title="Remaining Error Budget"
          tooltip="How much error budget remains before breaching the SLO target"
          value={metrics.remainingErrorBudget}
          format={formatErrorBudget}
          isLoading={metrics.isLoading}
          getColor={getErrorBudgetColor}
        />
        <StatCard
          title="Current Burn Rate"
          tooltip="Rate at which error budget is being consumed. A value of 1 means the budget will be exactly exhausted by the end of the window"
          value={metrics.burnRate}
          format={formatBurnRate}
          isLoading={metrics.isLoading}
          getColor={getBurnRateColor}
        />
      </div>

      {slo.labels && slo.labels.length > 0 ? (
        <Stack direction="column" gap={1}>
          <Text variant="bodySmall" color="secondary">
            Labels
          </Text>
          <Stack direction="row" gap={1} wrap>
            {slo.labels.map((label) => (
              <Badge key={`${label.key}=${label.value}`} text={`${label.key}: ${label.value}`} color="blue" />
            ))}
          </Stack>
        </Stack>
      ) : null}

      <Stack direction="row" gap={1}>
        {dashboardHref ? (
          <LinkButton href={dashboardHref} variant="primary" icon="dashboard">
            View dashboard
          </LinkButton>
        ) : null}
        <Button variant="secondary" icon="edit" onClick={() => onEdit?.(slo)}>
          Edit
        </Button>
      </Stack>
    </Stack>
  );
}

const getStatCardStyles = (theme: GrafanaTheme2) => ({
  card: css({
    label: 'slo-stat-card',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(2),
    background: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    minWidth: 0,
    flex: 1,
  }),
  cardHeader: css({
    label: 'slo-stat-card-header',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  }),
  cardValue: css({
    label: 'slo-stat-card-value',
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.fontWeightBold,
    lineHeight: 1.2,
  }),
});

const getStyles = (theme: GrafanaTheme2) => ({
  statsGrid: css({
    label: 'slo-stats-grid',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: theme.spacing(1),
  }),
});
