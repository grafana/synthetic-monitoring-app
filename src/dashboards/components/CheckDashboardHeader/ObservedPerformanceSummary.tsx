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
  const Narrative = profile.Narrative;
  const metrics = useMemo(() => profile.getMetrics(check), [check, profile]);

  return (
    <section aria-label="Observed performance" className={styles.container}>
      <div className={styles.headingRow}>
        <h2 className={styles.heading}>Observed performance</h2>
        <Narrative check={check} />
      </div>
      <div className={styles.metrics}>
        {metrics.map((metric) => (
          <HeaderMetric check={check} key={metric.id} metric={metric} />
        ))}
      </div>
    </section>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({ containerType: 'inline-size', display: 'flex', flexDirection: 'column', gap: theme.spacing(1) }),
  headingRow: css({
    alignItems: 'baseline',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1, 2),
    '& p': { color: theme.colors.text.secondary, margin: 0 },
  }),
  heading: css({ fontSize: theme.typography.h5.fontSize, margin: 0 }),
  metrics: css({
    display: 'grid',
    gap: theme.spacing(2),
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    '@container (max-width: 520px)': { gridTemplateColumns: '1fr 1fr' },
    '@container (max-width: 320px)': { gridTemplateColumns: '1fr' },
  }),
});
