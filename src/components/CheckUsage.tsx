import React, { FC } from 'react';
import { useFormContext } from 'react-hook-form';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Icon } from '@grafana/ui';
import { Check, CheckType } from 'types';
import { useUsageCalc } from 'hooks/useUsageCalc';

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    background-color: ${theme.colors.background.secondary};
    padding: ${theme.spacing(3)};
    margin-bottom: ${theme.spacing(2)};
  `,
  header: css`
    margin-bottom: ${theme.spacing(2)};
  `,
  icon: css`
    margin-right: ${theme.spacing(1)};
  `,
  section: css`
    margin-bottom: ${theme.spacing(1)};
  `,
  helpSection: css`
    margin-top: ${theme.spacing(2)};
  `,
  value: css`
    margin-left: ${theme.spacing(0.5)};
  `,
  link: css`
    text-decoration: underline;
  `,
});

const getCheckFromValues = (
  checkType: CheckType | undefined,
  frequency = 0,
  probes: number[] = [],
  publishAdvancedMetrics = false
): Partial<Check> | undefined => {
  if (!checkType) {
    return;
  }
  return {
    frequency: frequency * 1000,
    probes,
    basicMetricsOnly: !publishAdvancedMetrics,
    settings: {
      [checkType]: {},
    },
  };
};

export const CheckUsage: FC = () => {
  const styles = useStyles2(getStyles);
  const { watch } = useFormContext();
  const [checkType, frequency, probes, publishAdvancedMetrics] = watch([
    'checkType',
    'frequency',
    'probes',
    'publishAdvancedMetrics',
  ]);
  const check = getCheckFromValues(checkType?.value, frequency, probes, publishAdvancedMetrics);
  const usage = useUsageCalc(check);

  if (!usage) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h5 className={styles.header}>Approximate expected usage for this check</h5>
      <div className={styles.section}>
        <Icon className={styles.icon} name="calendar-alt" />
        Checks per month: <strong className={styles.value}>{usage.checksPerMonth.toLocaleString()}</strong>
      </div>
      <div className={styles.section}>
        <Icon className={styles.icon} name="chart-line" />
        Active series: <strong className={styles.value}>{usage.activeSeries.toLocaleString()}</strong>
      </div>
      <div className={styles.section}>
        <Icon className={styles.icon} name="clock-nine" />
        Data points per minute : <strong className={styles.value}>{usage.dpm.toLocaleString()}</strong>
      </div>
      <div className={styles.section}>
        <Icon className={styles.icon} name="database" />
        Log usage per month (GB): <strong className={styles.value}>{usage.logsGbPerMonth.toLocaleString()}</strong>
      </div>
      <div className={styles.helpSection}>
        <a
          href="https://grafana.com/docs/grafana-cloud/fundamentals/active-series-and-dpm/"
          className={styles.link}
          target="_blank"
          rel="noopenner noreferrer"
        >
          Learn more about active series and data points per minute
        </a>
      </div>
    </div>
  );
};
