import { SelectableValue } from '@grafana/data';
import { Field, Input, Label, Select } from '@grafana/ui';
import { Collapse } from 'components/Collapse';
import React, { FC, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { AlertRule, Label as LabelType } from 'types';
import { TIME_UNIT_OPTIONS } from './constants';

export enum TimeUnits {
  Milliseconds = 'ms',
  Seconds = 's',
  Minutes = 'm',
  Hours = 'h',
  Days = 'd',
  Weeks = 'w',
  Years = 'y',
}

export interface AlertFormValues {
  expression?: string;
  name: string;
  probePercentage?: number;
  timeCount: number;
  timeUnit: SelectableValue<TimeUnits>;
  labels: LabelType[];
  annotations: LabelType[];
}

export const parseAlertTimeUnits = (time: string) => {
  const regexp = /(\d+)(\D+)/;
  const [, timeCount, timeUnit] = regexp.exec(time) ?? ['', '', ''];
  return { timeCount, timeUnit };
};

const getAlertFormValues = (rule: AlertRule) => {
  const { timeCount, timeUnit } = parseAlertTimeUnits(rule.for ?? '');
  const timeOption = TIME_UNIT_OPTIONS.find(({ value }) => value === timeUnit);

  const labels = Object.entries(rule.labels ?? {})
    .map(([name, value]) => ({
      name,
      value,
    }))
    .filter(({ name }) => name !== 'severity'); // We give severity it's own location in the UI, so it needs to be removed from the labels section

  const probePercentage = parseFloat(rule.expr.split(' < ')?.[1]) * 100;

  if (!timeOption || !probePercentage) {
    return null;
  }
  return {
    name: rule.alert,
    probePercentage,
    timeCount: parseInt(timeCount, 10),
    timeUnit: timeOption ?? {},
    annotations: Object.keys(rule.annotations ?? {}).map(annotationName => ({
      name: annotationName,
      value: rule.annotations?.[annotationName] ?? '',
    })),
    labels,
  };
};

type Props = {
  rule: AlertRule;
};

export const AlertRuleForm: FC<Props> = ({ rule }) => {
  const defaultValues = getAlertFormValues(rule);
  const [isOpen, setIsOpen] = useState(false);
  const { register, control, handleSubmit } = useForm({
    defaultValues: defaultValues ?? {},
  });
  if (!defaultValues) {
    return <div>Rule unparseable</div>;
  }

  return (
    <Collapse label={rule.alert} isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} collapsible>
      <form>
        <Field label="Alert name">
          <Input ref={register} name="name" id="alert-name" />
        </Field>
        <Label>Expression</Label>
        <div>
          <span>An alert will fire if</span>
          <Input ref={register} name="probePercentage" type="number" />
          <span>or more probes report connection errors for</span>
          <Input ref={register} name="timeCount" type="number" />
          <Controller as={Select} control={control} name="timeUnit" options={TIME_UNIT_OPTIONS} />
        </div>
      </form>
    </Collapse>
  );
};
