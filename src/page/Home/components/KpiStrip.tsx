import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { LoadingPlaceholder, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { HomeKpis } from '../Home.types';

interface KpiStripProps {
  kpis: HomeKpis;
  overallReachability?: number | null;
  offlineProbeCount: number;
  totalProbeCount: number;
  isMetricsLoading: boolean;
}

type KpiTone = 'neutral' | 'good' | 'warning' | 'critical';

interface KpiValue {
  label: string;
  value: string;
  tone: KpiTone;
  isLoading?: boolean;
}

export const KpiStrip = ({
  kpis,
  overallReachability,
  offlineProbeCount,
  totalProbeCount,
  isMetricsLoading,
}: KpiStripProps) => {
  const styles = useStyles2(getStyles);

  const items: KpiValue[] = [
    {
      label: 'Total checks',
      value: String(kpis.totalChecks),
      tone: 'neutral',
    },
    {
      label: 'Down',
      value: String(kpis.downCount),
      tone: kpis.downCount > 0 ? 'critical' : 'good',
      isLoading: isMetricsLoading,
    },
    {
      label: 'Firing alerts',
      value: String(kpis.firingAlertsCount),
      tone: kpis.firingAlertsCount > 0 ? 'critical' : 'good',
      isLoading: isMetricsLoading,
    },
    {
      label: 'Degraded',
      value: String(kpis.degradedCount),
      tone: kpis.degradedCount > 0 ? 'warning' : 'good',
      isLoading: isMetricsLoading,
    },
    {
      label: 'Reachability (3h)',
      value: overallReachability != null ? `${(overallReachability * 100).toFixed(2)}%` : '–',
      tone: overallReachability != null && overallReachability < 1 ? 'warning' : 'good',
      isLoading: isMetricsLoading,
    },
    {
      label: 'Probes offline',
      value: totalProbeCount > 0 ? String(offlineProbeCount) : '–',
      tone: offlineProbeCount > 0 ? 'critical' : 'good',
    },
  ];

  return (
    <div className={styles.strip} data-testid="home-kpi-strip">
      {items.map((item) => (
        <div key={item.label} className={styles.card}>
          <div className={styles.label}>{item.label}</div>
          {item.isLoading ? (
            <LoadingPlaceholder text="" className={styles.loading} />
          ) : (
            <div className={cx(styles.value, styles[item.tone])}>{item.value}</div>
          )}
        </div>
      ))}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  strip: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: theme.spacing(1),
  }),
  card: css({
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(1.5, 2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  }),
  label: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    whiteSpace: 'nowrap',
  }),
  value: css({
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.fontWeightBold,
    lineHeight: 1.2,
  }),
  loading: css({
    marginBottom: 0,
  }),
  neutral: css({
    color: theme.colors.text.primary,
  }),
  good: css({
    color: theme.colors.success.text,
  }),
  warning: css({
    color: theme.colors.warning.text,
  }),
  critical: css({
    color: theme.colors.error.text,
  }),
});
