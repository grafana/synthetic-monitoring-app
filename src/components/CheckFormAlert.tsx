import React, { FC, useState } from 'react';
import { css } from 'emotion';
import { GrafanaTheme } from '@grafana/data';
import { Field, Select, useStyles } from '@grafana/ui';
import { Collapse } from './Collapse';
import { Controller } from 'react-hook-form';
import { ALERT_SENSITIVITY_OPTIONS } from './constants';

interface Props {
  checkId?: number;
}

const getStyles = (theme: GrafanaTheme) => ({
  marginBottom: css`
    margin-bottom: ${theme.spacing.md};
  `,
  link: css`
    text-decoration: underline;
  `,
});

export const CheckFormAlert: FC<Props> = () => {
  const [showAlerting, setShowAlerting] = useState(false);
  const styles = useStyles(getStyles);

  return (
    <Collapse label="Alerting" onToggle={() => setShowAlerting(!showAlerting)} isOpen={showAlerting} collapsible>
      <div className={styles.marginBottom}>
        Synthetic Monitoring provides some default alert rules via Cloud Alerting. By selecting an alert sensitivity,
        the metrics this check publishes will be associated with a Cloud Alerting rule. Default rules can be created and
        edited in the &nbsp;
        <a
          href="a/grafana-synthetic-monitoring-app/?page=alerts"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          alerts tab.
        </a>
      </div>
      <Field label="Select alert sensitivity">
        <Controller name="alertSensitivity" as={Select} width={40} options={ALERT_SENSITIVITY_OPTIONS} />
      </Field>
    </Collapse>
  );
};
