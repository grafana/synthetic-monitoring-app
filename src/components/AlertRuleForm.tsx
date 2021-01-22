import { AppEvents, GrafanaTheme, SelectableValue } from '@grafana/data';
import { Alert, Button, Field, HorizontalGroup, Input, Label, Select, useStyles } from '@grafana/ui';
import { Collapse } from 'components/Collapse';
import React, { FC, useState, useContext } from 'react';
import { Controller, FormContext, useForm } from 'react-hook-form';
import { AlertRule, AlertSensitivity, Label as LabelType, TimeUnits } from 'types';
import { TIME_UNIT_OPTIONS } from './constants';
import { css } from 'emotion';
import { AlertLabels } from './AlertLabels';
import { AlertAnnotations } from './AlertAnnotations';
import { useAsyncCallback } from 'react-async-hook';
import appEvents from 'grafana/app/core/app_events';
import { InstanceContext } from './InstanceContext';
import { SubCollapse } from './SubCollapse';
import { transformAlertFormValues } from './alertingTransformations';
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

export interface AlertFormValues {
  expression?: string;
  name: string;
  probePercentage: number;
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

const getAlertFormValues = (rule: AlertRule): AlertFormValues | undefined => {
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
});

type Props = {
  rule: AlertRule;
  onSubmit: (alertValues: AlertFormValues, sensitivity: AlertSensitivity) => Promise<FetchResponse<unknown>>;
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
  const { instance } = useContext(InstanceContext);
  const styles = useStyles(getStyles);
  const [isOpen, setIsOpen] = useState(false);
  const formMethods = useForm<AlertFormValues>({
    defaultValues,
  });
  const { register, control, handleSubmit, errors, watch, reset } = formMethods;
  const currentValues = watch() as AlertFormValues;
  const currentLabels = watch('labels');
  const currentAnnotations = watch('annotations');

  const onCancel = () => {
    reset();
    setIsOpen(false);
  };

  const { execute, error, loading: submitting } = useAsyncCallback(async (alertValues: AlertFormValues) => {
    if (!sensitivity) {
      return Promise.reject(
        'It looks like this rule has been edited from Cloud Alerting and can no longer be edited from Synthetic Monitoring. Please go to Cloud Alerting to update this rule.'
      );
    }
    const response = await onSubmit(alertValues, sensitivity);
    if (response.ok) {
      appEvents.emit(AppEvents.alertSuccess, ['Alert rule updated successfully']);
      setIsOpen(false);
      return Promise.resolve();
    }
    return Promise.reject('Something went wrong');
  });

  if (!defaultValues || !sensitivity) {
    return (
      <Collapse label={rule.alert} isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} collapsible>
        <div className={styles.container}>
          It looks like this rule has been edited in Cloud Alerting, and can no longer be edited in Synthetic
          Monitoring. To update this rule, visit{' '}
          <a
            href={`a/grafana-alerting-ui-app/?tab=rules&rulessource=${instance.metrics?.name}`}
            className={styles.link}
          >
            Grafana Cloud Alerting
          </a>
        </div>
      </Collapse>
    );
  }

  const preview = transformAlertFormValues(currentValues, sensitivity);

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
                data-testid="probePercentage"
                id="alertProbePercentage"
              />
            </Field>
            <span className={styles.inlineText}>% or more probes report connection errors for</span>
            <Field invalid={Boolean(errors?.timeCount)} error={errors?.timeCount?.message}>
              <Input
                ref={register({ required: true, min: 1, max: 999 })}
                name="timeCount"
                data-testid="timeCount"
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
      </FormContext>
    </Collapse>
  );
};
