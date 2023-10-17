import { css, cx } from '@emotion/css';
import { DisplayValue, GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { BigValue, BigValueColorMode, BigValueGraphMode, IconButton, Tooltip, useStyles2 } from '@grafana/ui';
import { SuccessRateContext, ThresholdSettings } from 'contexts/SuccessRateContext';
import { useMetricData } from 'hooks/useMetricData';
import React, { useContext } from 'react';
import { getLatencySuccessRateThresholdColor } from 'utils';
import { LATENCY_DESCRIPTION } from './constants';

interface Props {
  target: string;
  job: string;
  height: number;
  width: number;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

function getStyles(theme: GrafanaTheme2) {
  return {
    titleContainer: css`
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: ${theme.spacing(1)};
      height: 20px;
      justify-content: flex-start;
    `,
    title: css`
      padding-left: ${theme.spacing(2)};
    `,
    container: css`
      display: flex;
      flex-direction: column;
      margin-top: ${theme.spacing(1)};
      margin-x: ${theme.spacing(1)};
      height: 100%;
    `,
    infoIcon: css`
      cursor: default;
    `,
  };
}

const getDisplayValue = (data: any[], loading: boolean, thresholds: ThresholdSettings): DisplayValue => {
  if (loading) {
    return {
      numeric: 0,
      text: 'loading...',
    };
  }
  if (!data || data.length < 1) {
    return {
      numeric: 0,
      text: 'N/A',
    };
  }

  const latency = parseFloat(data[0].value[1]) * 1000;
  const color = getLatencySuccessRateThresholdColor(thresholds, 'latency', latency);

  return {
    color: color,
    numeric: latency,
    text: latency.toFixed(0) + 'ms',
  };
};

export const LatencyGauge = ({ target, job, height, width }: Props) => {
  const { thresholds } = useContext(SuccessRateContext);
  const query = `sum((rate(probe_all_duration_seconds_sum{probe=~".*", instance="${target}", job="${job}"}[6h]) OR rate(probe_duration_seconds_sum{probe=~".*", instance="${target}", job="${job}"}[6h]))) / sum((rate(probe_all_duration_seconds_count{probe=~".*", instance="${target}", job="${job}"}[6h]) OR rate(probe_duration_seconds_count{probe=~".*", instance="${target}", job="${job}"}[6h])))`;
  const styles = useStyles2(getStyles);

  const { data, loading } = useMetricData(query);
  const value = getDisplayValue(data, loading, thresholds);
  return (
    <div className={cx(styles.container)} style={{ width }}>
      <div className={styles.titleContainer}>
        <div className={styles.title} style={{ fontSize: Math.round(height / 6) }}>
          Latency
        </div>
        <Tooltip content={LATENCY_DESCRIPTION} placement="top-start">
          <IconButton name="info-circle" size="sm" aria-label={'Latency gauge info'} className={styles.infoIcon} />
        </Tooltip>
      </div>
      <BigValue
        theme={config.theme2}
        colorMode={BigValueColorMode.Value}
        height={height}
        width={width}
        graphMode={BigValueGraphMode.Area}
        value={value}
      />
    </div>
  );
};
