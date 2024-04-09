import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Field, Select, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValues } from 'types';

import { ALERT_SENSITIVITY_OPTIONS } from './constants';

export const CheckFormAlert = () => {
  const styles = useStyles2(getStyles);
  const { control, watch } = useFormContext<CheckFormValues>();
  const alertSensitivity = watch('alertSensitivity');

  const isCustomSensitivity = !Boolean(ALERT_SENSITIVITY_OPTIONS.find((option) => option.value === alertSensitivity));

  return (
    <>
      <div className={styles.marginBottom}>
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
                width={40}
                disabled={isCustomSensitivity}
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

const getStyles = (theme: GrafanaTheme2) => ({
  marginBottom: css({
    marginBottom: theme.spacing(2),
  }),
  link: css({
    textDecoration: `underline`,
  }),
});
