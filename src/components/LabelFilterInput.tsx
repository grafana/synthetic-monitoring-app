import React, { useMemo } from 'react';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { ButtonCascader, CascaderOption, MultiSelect, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check } from 'types';

interface Props {
  checks: Check[];
  labelFilters: string[];
  className?: string;
  onChange: (labels: string[]) => void;
}

interface AggregateLabels {
  [key: string]: string[];
}

const getStyles = (theme: GrafanaTheme2) => ({
  prefix: css`
    margin-left: -${theme.spacing(1)};
    z-index: 1000;
    height: 100%;
  `,
  cascader: css`
    border-top-right-radius: 0px;
    border-bottom-right-radius: 0px;
  `,
});

export const LabelFilterInput = ({ checks, labelFilters, onChange, className }: Props) => {
  const styles = useStyles2(getStyles);
  const aggregatedLabels = useMemo(
    () =>
      checks.reduce<AggregateLabels>((acc, check) => {
        check.labels?.forEach(({ name, value }) => {
          if (acc[name]) {
            if (!acc[name].find((preexisting) => preexisting === value)) {
              acc[name].push(value);
            }
          } else {
            acc[name] = [value];
          }
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
      aria-label="Filter by label"
      data-testid="check-label-filter"
      className={className}
      options={labelFilterOptions}
      onChange={(filters) => onChange(filters.map(({ value }) => value ?? ''))}
      value={labelFilters}
      isClearable
    />
  );
};
