import React, { useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckDashboardHeaderProfile } from './CheckDashboardHeader.types';
import { Check } from 'types';

import { HeaderMetric } from './HeaderMetric';

export function ObservedPerformanceSummary<TCheck extends Check>({
  check,
  profile,
}: {
  check: TCheck;
  profile: CheckDashboardHeaderProfile<TCheck>;
}) {
  const styles = useStyles2(getStyles);
  const metrics = useMemo(() => profile.getMetrics(check), [check, profile]);

  return (
    <section aria-label="Observed performance" className={styles.container}>
      <div className={styles.surface} data-testid="observed-performance-surface">
        <div className={styles.metrics}>
          {metrics.map((metric) => (
            <div className={styles.metricCell} data-testid="observed-performance-metric" key={metric.id}>
              <HeaderMetric check={check} metric={metric} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    containerType: 'inline-size',
    maxWidth: '1040px',
    minWidth: 0,
    width: '100%',
  }),
  surface: css({
    '--header-metric-value-size': theme.typography.h4.fontSize,
    background: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(1.5),
  }),
  metrics: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    '@container (max-width: 800px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  }),
  metricCell: css({
    minWidth: 0,
    padding: theme.spacing(0, 1.5),
    '&:first-child': { paddingLeft: 0 },
    '&:last-child': { paddingRight: 0 },
    '&:not(:first-child)': { borderLeft: `1px solid ${theme.colors.border.weak}` },
    '@container (max-width: 800px)': {
      padding: theme.spacing(1.5),
      '&:nth-child(odd)': { borderLeft: 0, paddingLeft: 0 },
      '&:nth-child(even)': { borderLeft: `1px solid ${theme.colors.border.weak}`, paddingRight: 0 },
      '&:nth-child(-n + 2)': { paddingTop: 0 },
      '&:nth-child(n + 3)': {
        borderTop: `1px solid ${theme.colors.border.weak}`,
        paddingBottom: 0,
      },
    },
  }),
});
