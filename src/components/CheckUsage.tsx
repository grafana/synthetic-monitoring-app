import React from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Label, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValues, CheckType } from 'types';
import { checkFormValuesToUsageCalcValues } from 'utils';
import { useUsageCalc } from 'hooks/useUsageCalc';

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    marginBottom: theme.spacing(6),
  }),
  calcList: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  }),
  icon: css({
    marginRight: theme.spacing(1),
  }),
  section: css({
    textWrap: 'nowrap',
  }),
  value: css({
    marginLeft: theme.spacing(0.5),
  }),
  link: css({
    textDecoration: 'underline',
  }),
});

const hideTelemetryForTypes = [CheckType.Scripted, CheckType.MULTI_HTTP];

export const CheckUsage = ({ checkType }: { checkType: CheckType }) => {
  const styles = useStyles2(getStyles);
  const { watch } = useFormContext<CheckFormValues>();
  const checkFormValues = watch();
  const usage = useUsageCalc([checkFormValuesToUsageCalcValues(checkFormValues)]);

  const hideTelemetry = hideTelemetryForTypes.includes(checkType);

  if (!usage) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Label
        description={
          !hideTelemetry && (
            <a
              href="https://grafana.com/docs/grafana-cloud/fundamentals/active-series-and-dpm/"
              className={styles.link}
              target="_blank"
              rel="noopenner noreferrer"
            >
              Learn more about active series and data points per minute
            </a>
          )
        }
      >
        Approximate expected usage for this check
      </Label>
      <div className={styles.calcList}>
        <div className={styles.section}>
          <Icon className={styles.icon} name="calendar-alt" />
          Checks per month: <strong className={styles.value}>{usage.checksPerMonth.toLocaleString()}</strong>
        </div>
        {!hideTelemetry && (
          <>
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
              Log usage per month (GB):{' '}
              <strong className={styles.value}>{usage.logsGbPerMonth.toLocaleString()}</strong>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
