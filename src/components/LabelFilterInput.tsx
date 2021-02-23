import { GrafanaTheme, SelectableValue } from '@grafana/data';
import { CascaderOption, MultiSelect, ButtonCascader, useStyles } from '@grafana/ui';
import React, { useMemo, useState } from 'react';
import { Check, Label } from 'types';
import { css } from 'emotion';

interface Props {
  checks: Check[];
  labelFilters: string[];
  onChange: (labels: string[]) => void;
}

interface AggregateLabels {
  [key: string]: string[];
}

const getStyles = (theme: GrafanaTheme) => ({
  prefix: css`
    margin-left: -${theme.spacing.sm};
    z-index: 1000;
  `,
  cascader: css`
    border-top-right-radius: 0px;
    border-bottom-right-radius: 0px;
  `,
});

export const LabelFilterInput = ({ checks, labelFilters, onChange }: Props) => {
  const styles = useStyles(getStyles);
  const aggregatedLabels = useMemo(
    () =>
      checks.reduce<AggregateLabels>((acc, check) => {
        check.labels?.forEach(({ name, value }) => {
          if (acc[name]) {
            acc[name].push(value);
          }
          acc[name] = [value];
        });
        return acc;
      }, {}),
    [checks]
  );

  const labelCascadeOptions: CascaderOption[] = useMemo(() => {
    return Object.entries(aggregatedLabels).map(([name, value]) => {
      return {
        value: name,
        label: name,
        children: value.map((labelValue: string) => ({
          value: labelValue,
          label: labelValue,
        })),
      };
    });
  }, [aggregatedLabels]);

  const labelFilterOptions: Array<SelectableValue<string>> = useMemo(() => {
    return Object.entries(aggregatedLabels).reduce<Array<SelectableValue<string>>>((acc, [name, value]) => {
      return acc.concat(
        value.map((labelValue) => ({ label: `${name}: ${labelValue}`, value: `${name}: ${labelValue}` }))
      );
    }, []);
  }, [aggregatedLabels]);

  const handleCascadeLabelSelect = (labelPath: string[]) => {
    onChange([...labelFilters, labelPath.join(': ')]);
  };

  return (
    <MultiSelect
      prefix={
        <div className={styles.prefix} onMouseDown={(e) => e.stopPropagation()}>
          <ButtonCascader options={labelCascadeOptions} onChange={handleCascadeLabelSelect} className={styles.cascader}>
            Labels
          </ButtonCascader>
        </div>
      }
      options={labelFilterOptions}
      onChange={(filters) => onChange(filters.map(({ value }) => value ?? ''))}
      value={labelFilters}
      isClearable
    />
  );
};
