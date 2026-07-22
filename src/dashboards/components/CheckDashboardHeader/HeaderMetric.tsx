import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Spinner, useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { useDashboardPanelQuery } from 'dashboards/hooks/useDashboardPanelQuery';

import { HeaderMetricDefinition } from './CheckDashboardHeader.types';
import { Check } from 'types';
import { Toggletip } from 'components/Toggletip';

function HeaderMetricSecondary({ secondary }: { secondary: NonNullable<HeaderMetricDefinition['secondary']> }) {
  const { panelData } = useDashboardPanelQuery(secondary.definition);
  const text = secondary.selectText(panelData);

  return text ? <span>{text}</span> : null;
}

export function HeaderMetric<TCheck extends Check>({
  check,
  metric,
}: {
  check?: TCheck;
  metric: HeaderMetricDefinition<TCheck>;
}) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const { panelData, isLoading } = useDashboardPanelQuery(metric.definition);
  const value = metric.selectValue(panelData);
  const displayValue = value === null && isLoading ? 'Loading' : metric.formatValue(value);
  const Details = metric.Details;
  const color = metric.getColor?.(theme, value);
  const secondaryText = metric.getSecondaryText?.(value);

  return (
    <section aria-label={metric.label} className={styles.metric} role="region">
      <div className={styles.labelRow}>
        <span className={styles.label}>{metric.label}</span>
        <Toggletip
          content={
            <div className={styles.toggletipContent}>
              <span>{metric.description}</span>
              {Details && check ? <Details check={check} /> : null}
            </div>
          }
        >
          <button aria-label={`About ${metric.label}`} className={styles.infoButton} type="button">
            <Icon name="info-circle" />
          </button>
        </Toggletip>
      </div>
      <div className={styles.valueRow}>
        <strong className={styles.value} style={{ color }}>
          {displayValue}
        </strong>
        {isLoading && value !== null ? (
          <span aria-label={`Updating ${metric.label}`} className={styles.updating}>
            <Spinner size="sm" />
          </span>
        ) : null}
      </div>
      <div className={styles.secondary}>
        {secondaryText ? <span>{secondaryText}</span> : null}
        {metric.secondary ? <HeaderMetricSecondary secondary={metric.secondary} /> : null}
      </div>
    </section>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  metric: css({ display: 'flex', flexDirection: 'column', gap: theme.spacing(0.5), minWidth: 0 }),
  labelRow: css({ alignItems: 'center', display: 'flex', gap: theme.spacing(0.5) }),
  label: css({ color: theme.colors.text.secondary, fontSize: theme.typography.bodySmall.fontSize }),
  infoButton: css({
    alignItems: 'center',
    background: 'transparent',
    border: 0,
    color: theme.colors.text.secondary,
    cursor: 'pointer',
    display: 'inline-flex',
    padding: 0,
  }),
  valueRow: css({ alignItems: 'center', display: 'flex', gap: theme.spacing(1) }),
  value: css({ fontSize: theme.typography.h3.fontSize, lineHeight: theme.typography.h3.lineHeight }),
  updating: css({ color: theme.colors.text.secondary, display: 'inline-flex' }),
  secondary: css({
    color: theme.colors.text.secondary,
    display: 'flex',
    flexDirection: 'column',
    fontSize: theme.typography.bodySmall.fontSize,
    minHeight: theme.spacing(2),
  }),
  toggletipContent: css({ display: 'flex', flexDirection: 'column', gap: theme.spacing(1.5) }),
});
