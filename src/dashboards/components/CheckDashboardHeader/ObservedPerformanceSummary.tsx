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
    background: theme.colors.background.secondary,
    minWidth: 0,
    padding: theme.spacing(0, CHECK_DASHBOARD_PAGE_GUTTER),
    width: '100%',
  }),
  surface: css({
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(1.5, 0),
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
