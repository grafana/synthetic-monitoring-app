import { css, cx } from '@emotion/css';
import { DisplayValue, GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { BigValue, BigValueColorMode, BigValueGraphMode, IconButton, Tooltip, useStyles2 } from '@grafana/ui';
import { SuccessRateContext, SuccessRateTypes, SuccessRateValue, ThresholdSettings } from 'contexts/SuccessRateContext';
import React, { useContext } from 'react';
import { getSuccessRateThresholdColor } from 'utils';

interface Props {
  title: 'Reachability' | 'Uptime';
  type: SuccessRateTypes;
  id: number;
  height: number;
  width: number;
  infoText?: string;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

const getDisplayValue = (
  title: 'Reachability' | 'Uptime',
  successRate: SuccessRateValue,
  loading: boolean,
  thresholds: ThresholdSettings
): DisplayValue => {
  if (loading) {
    return {
      numeric: 0,
      text: 'loading...',
    };
  }

  // Could do this better by not checking strings
  const successRateKey = title === 'Reachability' ? successRate.reachabilityValue : successRate.uptimeValue;
  const displayValueKey =
    title === 'Reachability' ? successRate.reachabilityDisplayValue : successRate.uptimeDisplayValue;
  const thresholdKey: any = title.toLowerCase();

  // Pick color based on tenant threshold settings
  const color = getSuccessRateThresholdColor(thresholds, thresholdKey, successRateKey!);

  return {
    title: '',
    color: color,
    numeric: successRateKey || 0,
    text: successRate.noData ? 'N/A' : displayValueKey!,
  };
};

function getStyles(theme: GrafanaTheme2) {
  return {
    titleContainer: css`
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: ${theme.spacing(1)};
      height: 20px;
      justify-content: flex-start;
      margin-x: ${theme.spacing(1)};
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

export const SuccessRateGauge = ({ title, type, id, height, width, infoText, onClick, className }: Props) => {
  const { values, loading, thresholds } = useContext(SuccessRateContext);
  const styles = useStyles2(getStyles);

  const value = getDisplayValue(title, values[type]?.[id] ?? values.defaults, loading, thresholds);
  return (
    <div className={cx(styles.container, className)} style={{ width }}>
      <div className={styles.titleContainer} style={{ fontSize: Math.round(height / 6) }}>
        <div className={styles.title}>{title}</div>
        {infoText && (
          <Tooltip content={infoText} placement="top-start">
            <IconButton name="info-circle" size="sm" aria-label={`${title} info`} className={styles.infoIcon} />
          </Tooltip>
        )}
      </div>
      <BigValue
        theme={config.theme2}
        colorMode={BigValueColorMode.Value}
        height={height}
        width={width}
        graphMode={BigValueGraphMode.Area}
        value={value}
        onClick={onClick}
      />
    </div>
  );
};
