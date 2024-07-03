import React, { useCallback } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { InlineField, InlineFieldRow, Input, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ThresholdValues } from 'types';

interface LabelProps {
  color: string;
  title: string;
}

interface ThresholdSectionProps {
  label: string;
  unit: '%' | 'ms';
  description: string;
  thresholds: ThresholdValues;
  setThresholds: (threshold: ThresholdValues) => void;
}

const getDotStyles = (color: string) => (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: 5px;
    margin-top: 5px;
    width: 80px;
  `,
  dot: css`
    background-color: ${color};
    width: 15px;
    height: 15px;
    border-radius: 50%;
    margin-right: 10px;
  `,
});

const getSectionStyles = () => (theme: GrafanaTheme2) => ({
  estimate: css`
    margin-bottom: 0px;
    font-style: italic;
    align-self: center;
    font-size: 0.7rem;
  `,
  disabled: css`
    // This is a hack, can't seem to get the disabled prop on Input to work
    div > input {
      cursor: not-allowed;
      background-color: rgba(204, 204, 220, 0.07);
      color: rgba(204, 204, 220, 0.4);
      border: 1px solid rgba(204, 204, 220, 0.07);
    }
  `,
  group: css`
    margin-top: 25px;
    margin-bottom: 25px;
  `,
  after: css`
    display: flex;
    align-items: center;
    padding: 5px;
  `,
});

const Dot = ({ color, title }: LabelProps) => {
  const styles = useStyles2(getDotStyles(color));
  return (
    <div className={styles.container}>
      <div className={styles.dot}></div>
      <strong>{title}</strong>
    </div>
  );
};

const displayDowntimeEstimate = (percentage: number) => {
  // 43800 minutes per month
  // 730 hours per month
  const minutesOfUptime = (percentage / 100) * 43800;
  const hoursOfDowntime = 730 - minutesOfUptime / 60;

  if (hoursOfDowntime < 1) {
    const minutes = hoursOfDowntime * 60;
    return `This translates to approximately ${minutes.toFixed(0)} minutes of downtime per month or ${(
      minutes / 31
    ).toFixed(0)} minute(s) per day.`;
  } else if (Number(hoursOfDowntime.toFixed(0)) === 1) {
    return `This translates to approximately one hour of downtime per month`;
  } else {
    return `This translates to approximately ${hoursOfDowntime.toFixed(0)} hours of downtime per month.`;
  }
};

export const ThresholdFormSection = ({
  label,
  unit,
  description,
  thresholds,
  setThresholds,
}: ThresholdSectionProps) => {
  const styles = useStyles2(getSectionStyles());
  const isLatency = unit === 'ms';
  const handleUpdateThreshold = useCallback(
    (key: string, newValue: number) => {
      const newThresholds = {
        ...thresholds,
        [key]: newValue,
      };
      setThresholds(newThresholds);
    },
    [thresholds, setThresholds]
  );

  const After = <div className={styles.after}>{unit}</div>;

  return (
    <div className={styles.group}>
      <h3>{label}</h3>
      <p>{description}</p>

      <InlineFieldRow>
        <Dot color={config.theme2.colors.success.main} title="Good" />
        <InlineField label={isLatency ? '<=' : '>='} transparent>
          <Input
            data-testid="upper-limit"
            value={isLatency ? thresholds.lowerLimit : thresholds.upperLimit}
            onChange={(e: React.FormEvent<HTMLInputElement>) => {
              const key = isLatency ? 'lowerLimit' : 'upperLimit';
              handleUpdateThreshold(key, e.currentTarget.valueAsNumber);
            }}
            max={isLatency ? thresholds.upperLimit : 100}
            min={isLatency ? 0 : thresholds.lowerLimit}
            step={isLatency ? 1 : 0.1}
            placeholder="value"
            type="number"
            addonAfter={After}
            width={12}
          />
        </InlineField>
        {!isLatency && <p className={styles.estimate}>{displayDowntimeEstimate(thresholds.upperLimit)}</p>}
      </InlineFieldRow>
      <InlineFieldRow>
        <Dot color={config.theme2.colors.warning.main} title="Warning" />
        <InlineField label={isLatency ? '<=' : '>='} transparent>
          <Input
            className={styles.disabled}
            value={isLatency ? thresholds.upperLimit : thresholds.lowerLimit}
            readOnly
            disabled={true}
            step={isLatency ? 1 : 0.1}
            placeholder="value"
            addonAfter={After}
            width={12}
          />
        </InlineField>
        <InlineField label={isLatency ? 'and >' : 'and <'} transparent>
          <Input
            className={styles.disabled}
            value={isLatency ? thresholds.lowerLimit : thresholds.upperLimit}
            readOnly
            disabled={true}
            step={isLatency ? 1 : 0.1}
            placeholder="value"
            addonAfter={After}
            width={12}
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <Dot color={config.theme2.colors.error.main} title="Critical" />
        <InlineField label={isLatency ? '>=' : '<='} transparent>
          <Input
            data-testid="lower-limit"
            value={isLatency ? thresholds.upperLimit : thresholds.lowerLimit}
            onChange={(e: React.FormEvent<HTMLInputElement>) => {
              const key = isLatency ? 'upperLimit' : 'lowerLimit';
              handleUpdateThreshold(key, e.currentTarget.valueAsNumber);
            }}
            max={isLatency ? undefined : thresholds.upperLimit}
            min={isLatency ? thresholds.lowerLimit : 0}
            step={isLatency ? 1 : 0.1}
            placeholder="value"
            type="number"
            addonAfter={After}
            width={12}
          />
        </InlineField>
        {!isLatency && <p className={styles.estimate}>{displayDowntimeEstimate(thresholds.lowerLimit)}</p>}
      </InlineFieldRow>
    </div>
  );
};
