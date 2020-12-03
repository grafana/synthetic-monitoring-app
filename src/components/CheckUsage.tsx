import React, { FC } from 'react';
import { useFormContext } from 'react-hook-form';
import { calculateUsage } from '../checkUsageCalc';
import { css } from 'emotion';
import { GrafanaTheme } from '@grafana/data';
import { useStyles } from '@grafana/ui';
import { CheckFormValues } from 'types';

const getStyles = (theme: GrafanaTheme) => ({
  container: css`
    background-color: ${theme.colors.bg2};
    padding: ${theme.spacing.lg};
    margin-bottom: ${theme.spacing.md};
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
      <h5>Approximate expected usage for this check</h5>
      <dl>
        <dt>Checks per month</dt>
        <dd>{checksPerMonth.toLocaleString()}</dd>
        <dt>Active series</dt> <dd>{activeSeries.toLocaleString()}</dd>
        <dt>Log usage per month (GB):</dt>
        <dd>{logsGbPerMonth.toLocaleString()}</dd>
      </dl>
    </div>
  );
};
