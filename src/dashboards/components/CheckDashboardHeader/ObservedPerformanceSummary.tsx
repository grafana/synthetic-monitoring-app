import React, { useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckDashboardHeaderProfile } from './CheckDashboardHeader.types';
import { Check } from 'types';

import { AlertHealthSummary } from './AlertHealthSummary';
import { CHECK_DASHBOARD_PAGE_GUTTER } from './CheckDashboardLayout.constants';
import { HeaderMetric } from './HeaderMetric';
import { LiveIncidentPrompt } from './LiveIncidentPrompt';

/** Switch from 4 columns to 2 before label + alert control + value + sparkline collide. */
const METRICS_STACK_MAX_WIDTH = '1100px';

export function ObservedPerformanceSummary<TCheck extends Check>({
  check,
  profile,
}: {
  check: TCheck;
  profile: CheckDashboardHeaderProfile<TCheck>;
}) {
  const styles = useStyles2(getStyles);
  const metrics = useMemo(() => profile.getMetrics(check), [check, profile]);
  const HealthProvider = profile.HealthProvider;
  const content = (
    <section aria-label="Observed performance" className={styles.container}>
      {HealthProvider ? <AlertHealthSummary /> : null}
      {HealthProvider ? <LiveIncidentPrompt /> : null}
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

  return HealthProvider ? (
    <HealthProvider check={check} metrics={metrics}>
      {content}
    </HealthProvider>
  ) : (
    content
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    containerType: 'inline-size',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    width: '100%',
  }),
  surface: css({
    background: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(1.5, CHECK_DASHBOARD_PAGE_GUTTER),
  }),
  metrics: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    [`@container (max-width: ${METRICS_STACK_MAX_WIDTH})`]: {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
  }),
  metricCell: css({
    display: 'flex',
    minWidth: 0,
    // Keep padding and border box identical on every cell so HeaderMetric
    // container queries see the same inline size across the row.
    padding: theme.spacing(0, 1.5),
    borderLeft: '1px solid transparent',
    '&:not(:first-child)': {
      borderLeftColor: theme.colors.border.weak,
    },
    [`@container (max-width: ${METRICS_STACK_MAX_WIDTH})`]: {
      padding: theme.spacing(1.5),
      borderTop: '1px solid transparent',
      '&:nth-child(odd)': {
        borderLeftColor: 'transparent',
      },
      '&:nth-child(even)': {
        borderLeftColor: theme.colors.border.weak,
      },
      '&:nth-child(n + 3)': {
        borderTopColor: theme.colors.border.weak,
      },
    },
  }),
});
