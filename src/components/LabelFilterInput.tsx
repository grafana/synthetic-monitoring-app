import { SelectableValue } from '@grafana/data';
import { CascaderOption, MultiSelect, ButtonCascader } from '@grafana/ui';
import React, { useMemo, useState } from 'react';
import { Check, Label } from 'types';

interface Props {
  checks: Check[];
  labelFilters: string[];
  onChange: (labels: string[]) => void;
}

interface AggregateLabels {
  [key: string]: string[];
}

export const LabelFilterInput = ({ checks, labelFilters, onChange }: Props) => {
  const aggregatedLabels = checks.reduce<AggregateLabels>((acc, check) => {
    check.labels?.forEach(({ name, value }) => {
      if (acc[name]) {
        acc[name].push(value);
      }
      acc[name] = [value];
    });
    return acc;
  }, {});

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
        <div>
          <ButtonCascader options={labelCascadeOptions} onChange={handleCascadeLabelSelect}>
            Labels
          </ButtonCascader>
        </div>
      }
      options={labelFilterOptions}
      onChange={(filters) => onChange(filters.map(({ value }) => value ?? ''))}
      value={labelFilters}
    />
  );
};
