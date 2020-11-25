import React, { FC } from 'react';
import { useFormContext } from 'react-hook-form';
import { calculateUsage } from '../checkUsageCalc';
import { css } from 'emotion';
import { GrafanaTheme } from '@grafana/data';
import { Label, useStyles } from '@grafana/ui';

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
  const checkType = watch('checkType');
  const frequency = watch('frequency');
  const probes = watch('probes');
  if (!checkType || !frequency || !probes) {
    return null;
  }
  const { checksPerMonth, activeSeries, logsGbPerMonth } = calculateUsage({
    probeCount: probes.length,
    frequencySeconds: frequency,
    checkType: checkType.value,
  });
  return (
    <div className={styles.container}>
      <h5>Approximate expected usage</h5>
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
