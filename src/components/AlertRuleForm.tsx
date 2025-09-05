import React, { useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { AppEvents, GrafanaTheme2, SelectableValue } from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';
import { Alert, Button, Field, Icon, Input, Label, Select, Stack, useStyles2 } from '@grafana/ui';
import appEvents from 'grafana/app/core/app_events';
import { css } from '@emotion/css';

import { AlertRule, AlertSensitivity, Label as LabelType, TimeUnits } from 'types';
import { useMetricsDS } from 'hooks/useMetricsDS';

import { AlertAnnotations } from './AlertAnnotations';
import { alertDescriptionFromRule, transformAlertFormValues } from './alertingTransformations';
import { AlertLabels } from './AlertLabels';
import { ALERT_SENSITIVITY_OPTIONS, TIME_UNIT_OPTIONS } from './constants';
import { SubCollapse } from './SubCollapse';

export enum AlertTimeUnits {
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
  probePercentage: number;
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

  const probePercentage = desc.threshold;

  if (!timeOption || !probePercentage || !sensitivityOption) {
    return undefined;
  }

  return {
    name: rule.alert,
    probePercentage,
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

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    background-color: ${theme.colors.background.secondary};
    padding: ${theme.spacing(2)};
    margin-bottom: ${theme.spacing(1)};
  `,
  inlineText: css`
    white-space: nowrap;
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
    margin-bottom: ${theme.spacing(2)};
  `,
  submitFail: css`
    margin-top: ${theme.spacing(2)};
  `,
  link: css`
    text-decoration: underline;
  `,
  previewHelpText: css`
    margin-top: ${theme.spacing(2)};
  `,
  preview: css`
    border: 1px solid ${theme.colors.border.medium};
    background-color: ${theme.colors.background.secondary};
    margin-bottom: ${theme.spacing(1)};
    color: ${theme.colors.text.secondary};
    line-height: 20px;
    padding: ${theme.spacing(1)};
  `,
  indent: css`
    margin-left: ${theme.spacing(1)};
  `,
  button: css`
    color: ${theme.colors.text.primary};
    background-color: ${theme.colors.background.secondary};
    width: 100%;
    border: none;
    text-align: left;
    padding: ${theme.spacing(2)};
    margin-bottom: ${theme.spacing(1)};
  `,
});

type Props = {
  canEdit: boolean;
  rule: AlertRule;
  onSubmit: (alertValues: AlertFormValues) => Promise<FetchResponse<unknown> | undefined>;
};

export const AlertRuleForm = ({ canEdit, rule, onSubmit }: Props) => {
  const defaultValues = getAlertFormValues(rule);
  const metricsDS = useMetricsDS();
  const styles = useStyles2(getStyles);
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
  const currentValues = watch();
  const currentLabels = watch('labels');
  const currentAnnotations = watch('annotations');

  const onCancel = () => {
    reset();
    setIsOpen(false);
  };

  const {
    execute,
    error,
    loading: submitting,
  } = useAsyncCallback(async (alertValues: AlertFormValues) => {
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
        {metricsDS && (
          <div>
            To update this rule, visit{' '}
            <a href={`alerting/list?dataSource=${metricsDS.name}`} className={styles.link}>
              Grafana Cloud Alerting
            </a>
          </div>
        )}
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
              <Input {...register('name', { required: true })} id="alert-name" disabled={!canEdit} />
            </Field>
            <div className={styles.expressionContainer}>
              <Label>Expression</Label>
              <Stack alignItems="center" justifyContent="flex-start" wrap="wrap">
                <span className={styles.inlineText}>Checks with a sensitivity level of</span>
                <div className={styles.selectInput}>
                  <Controller
                    render={({ field }) => {
                      const { ref, ...rest } = field;
                      // eslint-disable-next-line @typescript-eslint/no-deprecated
                      return <Select {...rest} options={ALERT_SENSITIVITY_OPTIONS} disabled={!canEdit} />;
                    }}
                    control={control}
                    name="sensitivity"
                  />
                </div>
                <span className={styles.inlineText}>will fire an alert if less than </span>
                <Field
                  invalid={Boolean(errors?.probePercentage)}
                  error={errors?.probePercentage?.message?.toString()}
                  className={styles.noMargin}
                >
                  <Input
                    className={styles.numberInput}
                    {...register('probePercentage', { required: true, max: 100, min: 1 })}
                    type="number"
                    data-testid="probePercentage"
                    id="alertProbePercentage"
                    disabled={!canEdit}
                  />
                </Field>
                <span className={styles.inlineText}>% of probes report connection success for</span>
                <Field
                  invalid={Boolean(errors?.timeCount)}
                  error={errors?.timeCount?.message?.toString()}
                  className={styles.noMargin}
                >
                  <Input
                    {...register('timeCount', { required: true, min: 1, max: 999 })}
                    aria-label="Time count"
                    type="number"
                    className={styles.numberInput}
                    id="alertTimeCount"
                    disabled={!canEdit}
                  />
                </Field>
                <div className={styles.selectInput}>
                  <Controller
                    render={({ field }) => {
                      const { ref, ...rest } = field;
                      return (
                        // eslint-disable-next-line @typescript-eslint/no-deprecated
                        <Select {...rest} options={TIME_UNIT_OPTIONS} aria-label="Time unit" disabled={!canEdit} />
                      );
                    }}
                    control={control}
                    name="timeUnit"
                  />
                </div>
              </Stack>
            </div>
            <AlertLabels canEdit={canEdit} />
            <AlertAnnotations canEdit={canEdit} />
            <SubCollapse title="Config preview">
              <div>
                <p className={styles.previewHelpText}>
                  This alert will appear as an alert rule in Grafana Cloud Alerting, where you can use the full power of
                  Prometheus style alerting.{' '}
                  <a
                    href="https://grafana.com/docs/grafana-cloud/alerting"
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
            <Stack>
              <Button type="submit" disabled={submitting || !canEdit}>
                Save alert
              </Button>
              <Button variant="secondary" type="button" onClick={onCancel}>
                Cancel
              </Button>
            </Stack>
            {error && (
              <div className={styles.submitFail}>
                <Alert title="There was an error updating the alert rule">{error.message}</Alert>
              </div>
            )}
          </form>
        </FormProvider>
      )}
    </>
  );
};
