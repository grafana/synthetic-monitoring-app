import { AppEvents, GrafanaTheme, SelectableValue } from '@grafana/data';
import { Alert, Button, Field, HorizontalGroup, Input, Label, Select, useStyles } from '@grafana/ui';
import { Collapse } from 'components/Collapse';
import React, { FC, useState } from 'react';
import { Controller, FormContext, useForm } from 'react-hook-form';
import { AlertRule, AlertSensitivity, Label as LabelType } from 'types';
import { TIME_UNIT_OPTIONS } from './constants';
import { css } from 'emotion';
import { AlertLabels } from './AlertLabels';
import { AlertAnnotations } from './AlertAnnotations';
import { useAsyncCallback } from 'react-async-hook';
import appEvents from 'grafana/app/core/app_events';

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

  const labels = Object.entries(rule.labels ?? {}).map(([name, value]) => ({
    name,
    value,
  }));

  const probePercentage = parseFloat(rule.expr.split(' < ')?.[1]) * 100;

  if (!timeOption || !probePercentage) {
    return undefined;
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

const getStyles = (theme: GrafanaTheme) => ({
  container: css`
    background-color: ${theme.colors.bg2};
    padding: ${theme.spacing.md};
  `,
  inlineText: css`
    white-space: nowrap;
    flex-grow: 1;
    margin-bottom: ${theme.spacing.md};
  `,
  numberInput: css`
    width: 75px;
    flex-shrink: 0;
  `,
  selectInput: css`
    width: 100px;
    flex-grow: 0;
    margin-bottom: ${theme.spacing.md};
  `,
  breakLine: css`
    margin-top: 0;
  `,
  submitFail: css`
    margin-top: ${theme.spacing.md};
  `,
});

type Props = {
  rule: AlertRule;
  onSubmit: (alertValues: AlertFormValues, sensitivity: AlertSensitivity) => Promise<void>;
};

const findSensitivity = (expression: string): AlertSensitivity | undefined => {
  const entry = Object.entries(AlertSensitivity).find(([_, sensitivityValue]) => {
    return expression.match(`alert_sensitivity="${sensitivityValue}"`);
  });
  return entry?.[1];
};

export const AlertRuleForm: FC<Props> = ({ rule, onSubmit }) => {
  const sensitivity = findSensitivity(rule.expr);
  const defaultValues = getAlertFormValues(rule);
  const styles = useStyles(getStyles);
  const [isOpen, setIsOpen] = useState(false);
  const formMethods = useForm<AlertFormValues>({
    defaultValues,
  });
  const { register, control, handleSubmit, errors } = formMethods;

  const { execute, error, loading: submitting } = useAsyncCallback(async (alertValues: AlertFormValues) => {
    if (!sensitivity) {
      return Promise.reject(
        'It looks like this rule has been edited from Cloud Alerting and can no longer be edited from Synthetic Monitoring. Please go to Cloud Alerting to update this rule.'
      );
    }
    await onSubmit(alertValues, sensitivity);
    appEvents.emit(AppEvents.alertSuccess, ['Alert rule updated successfully']);
    setIsOpen(false);
  });

  if (!defaultValues || !sensitivity) {
    return <div>Rule unparseable</div>;
  }

  return (
    <Collapse label={rule.alert} isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} collapsible>
      <FormContext {...formMethods}>
        <form className={styles.container} onSubmit={handleSubmit(execute)}>
          <Field label="Alert name">
            <Input ref={register({ required: true })} name="name" id="alert-name" />
          </Field>
          <Label>Expression</Label>
          <HorizontalGroup align="center">
            <span className={styles.inlineText}>An alert will fire if</span>
            <Field invalid={Boolean(errors?.probePercentage)} error={errors?.probePercentage?.message}>
              <Input
                className={styles.numberInput}
                ref={register({ required: true, max: 100, min: 1 })}
                name="probePercentage"
                type="number"
                id="alertProbePercentage"
              />
            </Field>
            <span className={styles.inlineText}>% or more probes report connection errors for</span>
            <Field invalid={Boolean(errors?.timeCount)} error={errors?.timeCount?.message}>
              <Input
                ref={register({ required: true, min: 1, max: 999 })}
                name="timeCount"
                type="number"
                className={styles.numberInput}
                id="alertTimeCount"
              />
            </Field>
            <div className={styles.selectInput}>
              <Controller as={Select} control={control} name="timeUnit" options={TIME_UNIT_OPTIONS} />
            </div>
          </HorizontalGroup>
          <AlertLabels />
          <AlertAnnotations />
          <hr className={styles.breakLine} />
          <HorizontalGroup>
            <Button type="submit" disabled={submitting}>
              Save alert
            </Button>
            <Button variant="secondary">Cancel</Button>
          </HorizontalGroup>
          {error && (
            <div className={styles.submitFail}>
              <Alert title="There was an error updating the alert rule">{error}</Alert>
            </div>
          )}
        </form>
      </FormContext>
    </Collapse>
  );
};
