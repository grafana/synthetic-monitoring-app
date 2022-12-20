import React, { FC, useState } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Field, Select, useStyles2 } from '@grafana/ui';
import { Collapse } from './Collapse';
import { Controller, useFormContext } from 'react-hook-form';
import { ALERT_SENSITIVITY_OPTIONS } from './constants';

interface Props {
  checkId?: number;
}

const getStyles = (theme: GrafanaTheme2) => ({
  marginBottom: css`
    margin-bottom: ${theme.spacing(2)};
  `,
  link: css`
    text-decoration: underline;
  `,
});

export const CheckFormAlert: FC<Props> = () => {
  const [showAlerting, setShowAlerting] = useState(false);
  const styles = useStyles2(getStyles);
  const { watch } = useFormContext();
  const alertSensitivity = watch('alertSensitivity');

  const isCustomSensitivity = !Boolean(
    ALERT_SENSITIVITY_OPTIONS.find((option) => option.value === alertSensitivity.value)
  );

  return (
    <Collapse
      label="Alerting (optional)"
      onToggle={() => setShowAlerting(!showAlerting)}
      isOpen={showAlerting}
      collapsible
    >
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
      <Field label="Select alert sensitivity" disabled={isCustomSensitivity}>
        <Controller
          name="alertSensitivity"
          render={({ field }) => (
            <Select
              {...field}
              width={40}
              disabled={isCustomSensitivity}
              data-testid="alertSensitivityInput"
              options={isCustomSensitivity ? [alertSensitivity] : ALERT_SENSITIVITY_OPTIONS}
            />
          )}
        />
      </Field>
    </Collapse>
  );
};
