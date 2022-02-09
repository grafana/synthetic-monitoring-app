import { AppEvents, GrafanaTheme, SelectableValue } from '@grafana/data';
import { Alert, Button, Field, HorizontalGroup, Icon, Input, Label, Select, useStyles } from '@grafana/ui';
import React, { useState, useContext } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import {
  AlertFormExpressionContent,
  AlertFormValidations,
  AlertRule,
  AlertSensitivity,
  Label as LabelType,
  TimeUnits,
} from 'types';
import { ALERT_SENSITIVITY_OPTIONS, TIME_UNIT_OPTIONS } from './constants';
import { css } from '@emotion/css';
import { AlertLabels } from './AlertLabels';
import { AlertAnnotations } from './AlertAnnotations';
import { useAsyncCallback } from 'react-async-hook';
import appEvents from 'grafana/app/core/app_events';
import { InstanceContext } from 'contexts/InstanceContext';
import { SubCollapse } from './SubCollapse';
import { transformAlertFormValues, alertDescriptionFromRule } from './alertingTransformations';
import { FetchResponse } from '@grafana/runtime';

export enum AlertTimeUnits {
  Milliseconds = 'ms',
  Seconds = 's',
  Minutes = 'm',
  Hours = 'h',
  Days = 'd',
  Weeks = 'w',
  Years = 'y',
}

interface AlertFormValues {
  name: string;
  metric: string;
  threshold: number;
  operator: string;
  timeCount: number;
  sensitivity: SelectableValue<AlertSensitivity>;
  timeUnit: SelectableValue<TimeUnits>;
  labels: LabelType[];
  annotations: LabelType[];
}

export const parseAlertTimeUnits = (time: string) => {
  const regexp = /(\d+)(\D+)/;
  const [, timeCount, timeUnit] = regexp.exec(time) ?? ['', '', ''];
  return { timeCount, timeUnit };
};

const getAlertFormValues = (rule: AlertRule): AlertFormValues | undefined => {
  const { timeCount, timeUnit } = parseAlertTimeUnits(rule.for ?? '');
  const timeOption = TIME_UNIT_OPTIONS.find(({ value }) => value === timeUnit);
  const desc = alertDescriptionFromRule(rule);

  if (!desc) {
    return undefined;
  }

  const sensitivityOption = ALERT_SENSITIVITY_OPTIONS.find(({ value }) => value === desc.sensitivity);

  const labels = Object.entries(rule.labels ?? {}).map(([name, value]) => ({
    name,
    value,
  }));

  if (!timeOption || !desc.threshold || !sensitivityOption) {
    return undefined;
  }

  return {
    name: rule.alert,
    metric: desc.metric,
    threshold: desc.threshold,
    operator: desc.operator,
    timeCount: parseInt(timeCount, 10),
    timeUnit: timeOption ?? {},
    sensitivity: sensitivityOption,
    annotations: Object.keys(rule.annotations ?? {}).map((annotationName) => ({
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
    margin-bottom: ${theme.spacing.sm};
  `,
  inlineText: css`
    white-space: nowrap;
    flex-grow: 1;
  `,
  numberInput: css`
    width: 75px;
    flex-shrink: 0;
  `,
  selectInput: css`
    width: 100px;
    flex-grow: 0;
    margin-bottom: 0;
  `,
  breakLine: css`
    margin-top: 0;
  `,
  noMargin: css`
    margin-bottom: 0;
  `,
  expressionContainer: css`
    margin-bottom: ${theme.spacing.md};
  `,
  submitFail: css`
    margin-top: ${theme.spacing.md};
  `,
  link: css`
    text-decoration: underline;
  `,
  previewHelpText: css`
    margin-top: ${theme.spacing.sm};
  `,
  preview: css`
    border: 1px solid ${theme.colors.panelBorder};
    background-color: ${theme.colors.panelBg};
    margin-bottom: ${theme.spacing.sm};
    color: ${theme.colors.textWeak};
    line-height: 20px;
    padding: ${theme.spacing.sm};
  `,
  indent: css`
    margin-left: ${theme.spacing.sm};
  `,
  button: css`
    color: ${theme.colors.textHeading};
    background-color: ${theme.colors.bg2};
    width: 100%;
    border: none;
    text-align: left;
    padding: ${theme.spacing.md};
    margin-bottom: ${theme.spacing.sm};
  `,
});

type Props = {
  rule: AlertRule;
  expressionContent: AlertFormExpressionContent;
  validations: AlertFormValidations;
  onSubmit: (alertValues: AlertFormValues) => Promise<FetchResponse<unknown> | undefined>;
};

export const AlertRuleForm = ({ rule, onSubmit, expressionContent, validations }: Props) => {
  const defaultValues = getAlertFormValues(rule);
  const { instance } = useContext(InstanceContext);
  const styles = useStyles(getStyles);
  const [isOpen, setIsOpen] = useState(false);
  const formMethods = useForm<AlertFormValues>({
    defaultValues,
  });
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = formMethods;
  const currentValues = watch() as AlertFormValues;
  const currentLabels = watch('labels');
  const currentAnnotations = watch('annotations');

  const onCancel = () => {
    reset();
    setIsOpen(false);
  };

  const { execute, error, loading: submitting } = useAsyncCallback(async (alertValues: AlertFormValues) => {
    try {
      await onSubmit(alertValues);
      appEvents.emit(AppEvents.alertSuccess, ['Alert rule updated successfully']);
      formMethods.reset(alertValues);
      setIsOpen(false);
      return Promise.resolve();
    } catch (e) {
      const err = e as Error;
      return Promise.reject(err.message ?? 'Something went wrong');
    }
  });

  if (!defaultValues) {
    return !isOpen ? (
      <button className={styles.button} onClick={() => setIsOpen(!isOpen)}>
        <Icon name="angle-right" /> {rule.alert}
      </button>
    ) : (
      <div className={styles.container}>
        It looks like this rule has been edited in Cloud Alerting, and can no longer be edited in Synthetic Monitoring.
        To update this rule, visit{' '}
        <a href={`a/grafana-alerting-ui-app/?tab=rules&rulessource=${instance.metrics?.name}`} className={styles.link}>
          Grafana Cloud Alerting
        </a>
      </div>
    );
  }

  const preview = transformAlertFormValues(currentValues);

  return (
    <>
      {!isOpen ? (
        <button className={styles.button} onClick={() => setIsOpen(!isOpen)}>
          <Icon name="angle-right" /> {rule.alert}
        </button>
      ) : (
        <FormProvider {...formMethods}>
          <form className={styles.container} onSubmit={handleSubmit(execute)}>
            <Field label="Alert name">
              <Input {...register('name', { required: true })} id="alert-name" />
            </Field>
            <div className={styles.expressionContainer}>
              <Label>Expression</Label>
              <HorizontalGroup align="center" wrap marginHeight={0}>
                <span className={styles.inlineText}>Checks with a sensitivity level of</span>
                <div className={styles.selectInput}>
                  <Controller
                    render={({ field }) => <Select {...field} options={ALERT_SENSITIVITY_OPTIONS} />}
                    control={control}
                    name="sensitivity"
                  />
                </div>
                <span className={styles.inlineText}>{expressionContent.willFireIf}</span>
                <Field
                  invalid={Boolean(errors?.threshold)}
                  error={errors?.threshold?.message?.toString()}
                  className={styles.noMargin}
                >
                  <Input
                    className={styles.numberInput}
                    {...register('threshold', {
                      required: true,
                      max: validations.threshold.max,
                      min: validations.threshold.min,
                    })}
                    type="number"
                    data-testid="threshold"
                    id="alertThreshold"
                  />
                </Field>
                <span className={styles.inlineText}>{expressionContent.conditionFor}</span>
                <Field
                  invalid={Boolean(errors?.timeCount)}
                  error={errors?.timeCount?.message?.toString()}
                  className={styles.noMargin}
                >
                  <Input
                    {...register('timeCount', {
                      required: true,
                      min: validations.timeCount.min,
                      max: validations.timeCount.max,
                    })}
                    data-testid="timeCount"
                    type="number"
                    className={styles.numberInput}
                    id="alertTimeCount"
                  />
                </Field>
                <div className={styles.selectInput}>
                  <Controller
                    render={({ field }) => <Select {...field} options={TIME_UNIT_OPTIONS} />}
                    control={control}
                    name="timeUnit"
                  />
                </div>
              </HorizontalGroup>
            </div>
            <AlertLabels />
            <AlertAnnotations />
            <SubCollapse title="Config preview">
              <div>
                <p className={styles.previewHelpText}>
                  This alert will appear as an alert rule in Grafana Cloud Alerting, where you can use the full power of
                  Prometheus style alerting.{' '}
                  <a
                    href="https://grafana.com/docs/grafana-cloud/alerts/grafana-cloud-alerting/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    Learn more{' '}
                  </a>
                </p>
                <div className={styles.preview}>
                  <div>alert: {preview.alert}</div>
                  <div>expr: {preview.expr}</div>
                  <div>for: {preview.for}</div>
                  {currentLabels.length ? (
                    <div>
                      labels:
                      {currentLabels.map(({ name, value }, index) => (
                        <div className={styles.indent} key={index}>
                          {name}: {value}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {currentAnnotations.length ? (
                    <div>
                      annotations:
                      {currentAnnotations.map(({ name, value }, index) => (
                        <div className={styles.indent} key={index}>
                          {name}: {value}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </SubCollapse>
            <hr className={styles.breakLine} />
            <HorizontalGroup>
              <Button type="submit" disabled={submitting}>
                Save alert
              </Button>
              <Button variant="secondary" type="button" onClick={onCancel}>
                Cancel
              </Button>
            </HorizontalGroup>
            {error && (
              <div className={styles.submitFail}>
                <Alert title="There was an error updating the alert rule">{error}</Alert>
              </div>
            )}
          </form>
        </FormProvider>
      )}
    </>
  );
};
