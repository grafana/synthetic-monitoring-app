import React, { useCallback } from 'react';

import { InlineFieldRow, InlineField, Input, CollapsableSection, useStyles2 } from '@grafana/ui';

import { config } from '@grafana/runtime';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { Threshold } from './ThresholdGlobalSettings';

interface LabelProps {
  color: string;
  title: string;
}

interface ThresholdSectionProps {
  label: string;
  unit: '%' | 'ms';
  description: string;
  thresholds: Threshold;
  setThresholds: (threshold: Threshold) => void;
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

const ThresholdFormSection = ({ label, unit, description, thresholds, setThresholds }: ThresholdSectionProps) => {
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

  const After = <div style={{ display: 'flex', alignItems: 'center', padding: '5px' }}>{unit}</div>;

  return (
    <CollapsableSection label={label} isOpen={true}>
      <p>{description}</p>

      <InlineFieldRow>
        <Dot color={config.theme2.colors.success.main} title="Good" />
        <InlineField label={isLatency ? '<=' : '>='} transparent>
          <Input
            value={isLatency ? thresholds.lower_limit : thresholds.upper_limit}
            onChange={(e: React.FormEvent<HTMLInputElement>) => {
              const key = isLatency ? 'lower_limit' : 'upper_limit';
              handleUpdateThreshold(key, e.currentTarget.valueAsNumber);
            }}
            max={isLatency ? thresholds.upper_limit : 100}
            min={isLatency ? 0 : thresholds.lower_limit}
            step={isLatency ? 1 : 0.1}
            placeholder="value"
            type="number"
            addonAfter={After}
            width={12}
          />
        </InlineField>
        {!isLatency && <p className={styles.estimate}>{displayDowntimeEstimate(thresholds.upper_limit)}</p>}
      </InlineFieldRow>
      <InlineFieldRow>
        <Dot color={config.theme2.colors.warning.main} title="Warning" />
        <InlineField label={isLatency ? '<=' : '>='} transparent>
          <Input
            value={isLatency ? thresholds.upper_limit : thresholds.lower_limit}
            onChange={(e: React.FormEvent<HTMLInputElement>) => {
              const key = isLatency ? 'upper_limit' : 'lower_limit';
              handleUpdateThreshold(key, e.currentTarget.valueAsNumber);
            }}
            max={isLatency ? undefined : thresholds.upper_limit}
            min={isLatency ? thresholds.lower_limit : 0}
            step={isLatency ? 1 : 0.1}
            placeholder="value"
            type="number"
            addonAfter={After}
            width={12}
          />
        </InlineField>
        <InlineField label={isLatency ? 'and >' : 'and <'} transparent>
          <Input
            value={isLatency ? thresholds.lower_limit : thresholds.upper_limit}
            onChange={(e: React.FormEvent<HTMLInputElement>) => {
              const key = isLatency ? 'lower_limit' : 'upper_limit';
              handleUpdateThreshold(key, e.currentTarget.valueAsNumber);
            }}
            max={isLatency ? undefined : thresholds.upper_limit}
            min={isLatency ? thresholds.upper_limit : thresholds.lower_limit}
            step={isLatency ? 1 : 0.1}
            placeholder="value"
            type="number"
            addonAfter={After}
            width={12}
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <Dot color={config.theme2.colors.error.main} title="Critical" />
        <InlineField label={isLatency ? '>=' : '<='} transparent>
          <Input
            value={isLatency ? thresholds.upper_limit : thresholds.lower_limit}
            onChange={(e: React.FormEvent<HTMLInputElement>) => {
              const key = isLatency ? 'upper_limit' : 'lower_limit';
              handleUpdateThreshold(key, e.currentTarget.valueAsNumber);
            }}
            max={isLatency ? undefined : thresholds.lower_limit}
            min={isLatency ? thresholds.lower_limit : 0}
            step={isLatency ? 1 : 0.1}
            placeholder="value"
            type="number"
            addonAfter={After}
            width={12}
          />
        </InlineField>
        {!isLatency && <p className={styles.estimate}>{displayDowntimeEstimate(thresholds.lower_limit)}</p>}
      </InlineFieldRow>
    </CollapsableSection>
  );
};

export default ThresholdFormSection;
