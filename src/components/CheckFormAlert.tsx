import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Field, Select, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValues } from 'types';

import { useCheckFormContext } from './CheckForm/CheckFormContext/CheckFormContext';
import { ALERT_SENSITIVITY_OPTIONS } from './constants';

export const CheckFormAlert = () => {
  const styles = useStyles2(getStyles);
  const { control, watch } = useFormContext<CheckFormValues>();
  const { isFormDisabled } = useCheckFormContext();
  const alertSensitivity = watch('alertSensitivity');

  const isCustomSensitivity = !Boolean(ALERT_SENSITIVITY_OPTIONS.find((option) => option.value === alertSensitivity));

  return (
    <>
      <div className={styles.marginBottom}>
        <h3 className={styles.title}>Alert sensitivity</h3>
        <p>
          Synthetic Monitoring provides some default alert rules via Cloud Alerting. By selecting an alert sensitivity,
          the metrics this check publishes will be associated with a Cloud Alerting rule. Default rules can be created
          and edited in the &nbsp;
          <a
            href="a/grafana-synthetic-monitoring-app/?page=alerts"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            alerts tab.
          </a>
        </p>
        <p>Tip: adding multiple probes can help to prevent alert flapping for less frequent checks</p>
      </div>
      <Field label="Select alert sensitivity" data-fs-element="Alert sensitivity select">
        <Controller
          control={control}
          name="alertSensitivity"
          render={({ field }) => {
            const { ref, ...rest } = field;
            return (
              <Select
                {...rest}
                aria-label="Select alert sensitivity"
                width={40}
                disabled={isFormDisabled || isCustomSensitivity}
                data-testid="alertSensitivityInput"
                options={
                  isCustomSensitivity
                    ? [{ label: alertSensitivity, value: alertSensitivity }]
                    : ALERT_SENSITIVITY_OPTIONS
                }
                onChange={(e) => {
                  field.onChange(e.value);
                }}
              />
            );
          }}
        />
      </Field>
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  const headingDisplay = `h4`;

  return {
    marginBottom: css({
      marginBottom: theme.spacing(2),
    }),
    link: css({
      textDecoration: `underline`,
    }),
    title: css({
      fontSize: theme.typography[headingDisplay].fontSize,
      fontWeight: theme.typography[headingDisplay].fontWeight,
      lineHeight: theme.typography[headingDisplay].lineHeight,
    }),
  };
};
