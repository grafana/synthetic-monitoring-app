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

const Dot = ({ color, title }: LabelProps) => {
  const styles = useStyles2(getDotStyles(color));
  return (
    <div className={styles.container}>
      <div className={styles.dot}></div>
      <strong>{title}</strong>
    </div>
  );
};

// Revert values for latency

const ThresholdFormSection = ({ label, unit, description, thresholds, setThresholds }: ThresholdSectionProps) => {
  const isLatency = unit === 'ms';
  // prevent overlap
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
            max={isLatency ? undefined : 100}
            min={0}
            step={isLatency ? 1 : 0.1}
            placeholder="value"
            type="number"
            addonAfter={After}
            width={12}
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <Dot color={config.theme2.colors.warning.main} title="Warning" />
        <InlineField label=">=" transparent>
          <Input
            value={isLatency ? thresholds.upper_limit : thresholds.lower_limit}
            onChange={(e: React.FormEvent<HTMLInputElement>) => {
              const key = isLatency ? 'upper_limit' : 'lower_limit';
              handleUpdateThreshold(key, e.currentTarget.valueAsNumber);
            }}
            max={isLatency ? undefined : 100}
            min={0}
            step={isLatency ? 1 : 0.1}
            placeholder="value"
            type="number"
            addonAfter={After}
            width={12}
          />
        </InlineField>
        <InlineField label="and <" transparent>
          <Input
            value={isLatency ? thresholds.lower_limit : thresholds.upper_limit}
            onChange={(e: React.FormEvent<HTMLInputElement>) => {
              const key = isLatency ? 'lower_limit' : 'upper_limit';
              handleUpdateThreshold(key, e.currentTarget.valueAsNumber);
            }}
            max={isLatency ? undefined : 100}
            min={0}
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
            max={isLatency ? undefined : 100}
            min={0}
            step={isLatency ? 1 : 0.1}
            placeholder="value"
            type="number"
            addonAfter={After}
            width={12}
          />
        </InlineField>
      </InlineFieldRow>
    </CollapsableSection>
  );
};

export default ThresholdFormSection;
