import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Spinner, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

const ANALYSIS_STEPS = [
  { icon: 'search' as const, text: 'Discovering services and endpoints from recent traffic' },
  { icon: 'chart-line' as const, text: 'Reviewing request volume, errors, latency, and outage history' },
  { icon: 'ai-sparkle' as const, text: 'Ranking uncovered monitoring opportunities with AI' },
];

export function ReliabilityInboxLoadingState() {
  const styles = useStyles2(getStyles);

  return (
    <section
      aria-labelledby="reliability-inbox-loading-title"
      aria-live="polite"
      className={styles.panel}
      role="status"
    >
      <div className={styles.accentBar} aria-hidden="true" />
      <div className={styles.icon} aria-hidden="true">
        <Icon name="ai-sparkle" size="xl" />
      </div>
      <Stack direction="column" gap={2}>
        <Stack direction="column" gap={0.5}>
          <Text element="h2" id="reliability-inbox-loading-title" variant="h3" weight="medium">
            Finding gaps in your monitoring
          </Text>
          <Text element="p" color="secondary">
            We’re analyzing recent Prometheus telemetry, comparing it with your existing Synthetic Monitoring checks,
            and using AI to surface the most useful opportunities.
          </Text>
        </Stack>
        <ul className={styles.steps} aria-label="Analysis includes">
          {ANALYSIS_STEPS.map((step) => (
            <li className={styles.step} key={step.text}>
              <Icon className={styles.stepIcon} name={step.icon} aria-hidden="true" />
              <Text>{step.text}</Text>
            </li>
          ))}
        </ul>
        <Stack alignItems="center" gap={1}>
          <Spinner inline size="sm" />
          <Text color="secondary" variant="bodySmall" weight="medium">
            This may take a minute.
          </Text>
        </Stack>
      </Stack>
    </section>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  panel: css({
    label: 'reliability-inbox-loading-panel',
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr)',
    gap: theme.spacing(2.5),
    width: '100%',
    maxWidth: 840,
    overflow: 'hidden',
    padding: theme.spacing(3),
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.primary,
    boxShadow: theme.shadows.z1,
    [`@media (max-width: ${theme.breakpoints.values.sm}px)`]: {
      gridTemplateColumns: '1fr',
      gap: theme.spacing(2),
      padding: theme.spacing(2.5),
    },
  }),
  accentBar: css({
    label: 'reliability-inbox-loading-accent',
    position: 'absolute',
    inset: '0 auto 0 0',
    width: 3,
    background: theme.colors.info.border,
  }),
  icon: css({
    label: 'reliability-inbox-loading-icon',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: theme.spacing(5.5),
    height: theme.spacing(5.5),
    flexShrink: 0,
    color: theme.colors.info.text,
    background: theme.colors.info.transparent,
    border: `1px solid ${theme.colors.info.border}`,
    borderRadius: '50%',
  }),
  steps: css({
    label: 'reliability-inbox-loading-steps',
    display: 'grid',
    gap: theme.spacing(1),
    margin: 0,
    padding: 0,
    listStyle: 'none',
  }),
  step: css({
    label: 'reliability-inbox-loading-step',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.25),
    minHeight: theme.spacing(4.75),
    padding: theme.spacing(1, 1.5),
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.secondary,
    [`@media (max-width: ${theme.breakpoints.values.sm}px)`]: {
      alignItems: 'flex-start',
    },
  }),
  stepIcon: css({
    label: 'reliability-inbox-loading-step-icon',
    flexShrink: 0,
    color: theme.colors.info.text,
  }),
});
