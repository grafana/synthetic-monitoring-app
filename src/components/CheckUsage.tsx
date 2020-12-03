import React, { FC } from 'react';
import { useFormContext } from 'react-hook-form';
import { calculateUsage } from '../checkUsageCalc';
import { css } from 'emotion';
import { GrafanaTheme } from '@grafana/data';
import { useStyles, Icon } from '@grafana/ui';
import { CheckFormValues } from 'types';

const getStyles = (theme: GrafanaTheme) => ({
  container: css`
    background-color: ${theme.colors.bg2};
    padding: ${theme.spacing.lg};
    margin-bottom: ${theme.spacing.md};
  `,
  header: css`
    margin-bottom: ${theme.spacing.md};
  `,
  icon: css`
    margin-right: ${theme.spacing.sm};
  `,
  section: css`
    margin-bottom: ${theme.spacing.sm};
  `,
  value: css`
    margin-left: ${theme.spacing.xs};
  `,
});

export const CheckUsage: FC = () => {
  const styles = useStyles(getStyles);
  const { watch } = useFormContext();
  const { checkType, frequency, probes }: Partial<CheckFormValues> = watch(['checkType', 'frequency', 'probes']);

  if (!checkType?.value || !frequency || !probes) {
    return null;
  }
  const { checksPerMonth, activeSeries, logsGbPerMonth } = calculateUsage({
    probeCount: probes.length,
    frequencySeconds: frequency,
    checkType: checkType.value,
  });
  return (
    <div className={styles.container}>
      <h5 className={styles.header}>Approximate expected usage for this check</h5>
      <div className={styles.section}>
        <Icon className={styles.icon} name={'calendar-alt'} />
        Checks per month: <strong className={styles.value}>{checksPerMonth.toLocaleString()}</strong>
      </div>
      <div className={styles.section}>
        <Icon className={styles.icon} name={'chart-line'} />
        Active series: <strong className={styles.value}>{activeSeries.toLocaleString()}</strong>
      </div>
      <div className={styles.section}>
        <Icon className={styles.icon} name={'database'} />
        Log usage per month (GB): <strong className={styles.value}>{logsGbPerMonth.toLocaleString()}</strong>
      </div>
    </div>
  );
};
