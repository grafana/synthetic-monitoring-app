import React, { useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { ButtonCascader, CascaderOption, ComboboxOption, MultiCombobox, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check } from 'types';

interface LabelFilterInputProps {
  checks: Check[];
  labelFilters: string[];
  className?: string;
  onChange: (labels: string[]) => void;
}

interface AggregateLabels {
  [key: string]: string[];
}

export const LabelFilterInput = ({ checks, labelFilters, onChange, className }: LabelFilterInputProps) => {
  const labelId = "check-label-filter";
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

  const labelFilterOptions: Array<ComboboxOption<string>> = useMemo(() => {
    return Object.entries(aggregatedLabels).reduce<Array<ComboboxOption<string>>>((acc, [name, value]) => {
      return acc.concat(
        value.map((labelValue) => ({ label: `${name}: ${labelValue}`, value: `${name}: ${labelValue}` }))
      );
    }, []);
  }, [aggregatedLabels]);

  const handleCascadeLabelSelect = (labelPath: string[]) => {
    onChange([...labelFilters, labelPath.join(': ')]);
  };

  return (
    <div className={styles.filterInput}>
      <ButtonCascader options={labelCascadeOptions} onChange={handleCascadeLabelSelect}>
        Labels
      </ButtonCascader>
      <MultiCombobox
        id={labelId}
        options={labelFilterOptions}
        onChange={(filters) => onChange(filters.map(({ value }) => value ?? ''))}
        value={labelFilters}
        isClearable
      />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  filterInput: css({
    display: `flex`,
    flexDirection: `row`,
    marginTop: `10px`,
    marginBottom: 0,
    justifyContent: 'flex-start',
    width: `100%`,
    '& button': {
      height: 'auto',
    },
  }),
});
