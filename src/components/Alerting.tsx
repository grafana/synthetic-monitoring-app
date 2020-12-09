import React, { FC, useState, useContext } from 'react';
import { css } from 'emotion';
import { GrafanaTheme } from '@grafana/data';
import { Input, Label, Select, useStyles } from '@grafana/ui';
import { Collapse } from './Collapse';
import { Controller, useFormContext } from 'react-hook-form';
import { ALERTING_SEVERITY_OPTIONS, TIME_UNIT_OPTIONS } from './constants';
import { AlertRule } from 'types';
import { InstanceContext } from './InstanceContext';
import { AlertAnnotations } from './AlertAnnotations';
import { AlertLabels } from './AlertLabels';

interface Props {
  alertRules: AlertRule[];
  editing: boolean;
  checkId?: number;
}

const getStyles = (theme: GrafanaTheme) => ({
  subheader: css`
    margin-top: ${theme.spacing.md};
  `,
  link: css`
    text-decoration: underline;
  `,
  container: css`
    background: #202226;
    padding: ${theme.spacing.md};
    display: flex;
    flex-direction: column;
  `,
  inputWrapper: css`
    margin-bottom: ${theme.spacing.md};
  `,
  numberInput: css`
    max-width: 72px;
    margin-right: ${theme.spacing.sm};
  `,
  horizontallyAligned: css`
    display: flex;
    align-items: center;
  `,
  text: css`
    font-size: ${theme.typography.size.sm};
    color: ${theme.colors.formLabel};
  `,
  select: css`
    max-width: 200px;
  `,
  severityContainer: css`
    margin-bottom: ${theme.spacing.md};
  `,
});

export const Alerting: FC<Props> = ({ alertRules, editing, checkId }) => {
  const [showAlerting, setShowAlerting] = useState(false);
  const { instance } = useContext(InstanceContext);
  const { register } = useFormContext();
  const styles = useStyles(getStyles);

  if (!instance.alertRuler) {
    return (
      <Collapse label="Alerting" onToggle={() => setShowAlerting(!showAlerting)} isOpen={showAlerting} collapsible>
        <div className={styles.container}>
          <p>
            Alerts can only be created for Synthetic Monitoring checks from{' '}
            <a href="https://grafana.com" className={styles.link}>
              Grafana Cloud Alerting
            </a>
          </p>
        </div>
      </Collapse>
    );
  }

  if (alertRules.length && editing) {
    return (
      <Collapse label="Alerting" onToggle={() => setShowAlerting(!showAlerting)} isOpen={showAlerting} collapsible>
        <div className={styles.container}>
          <p>
            {alertRules.length} alert{alertRules.length > 1 ? 's are' : ' is'} tied to this check. Edit this check's
            alerts in the <code>syntheticmonitoring &gt; {checkId}</code> section of{' '}
            <a
              href={`a/grafana-alerting-ui-app/?tab=rules&rulessource=${instance.metrics?.name}`}
              className={styles.link}
            >
              Cloud Alerting
            </a>
          </p>
        </div>
      </Collapse>
    );
  }
  return (
    <Collapse label="Alerting" onToggle={() => setShowAlerting(!showAlerting)} isOpen={showAlerting} collapsible>
      <p className={styles.subheader}>
        Set up alerts based on criteria that you define. These alerts can be created here and edited in the{' '}
        <a href={`a/grafana-alerting-ui-app/?tab=rules&rulessource=${instance.metrics?.name}`} className={styles.link}>
          Grafana Cloud Alerting UI
        </a>
        .
      </p>
      <div className={styles.container}>
        <div className={styles.inputWrapper}>
          <Label htmlFor="alert-name">Alert name</Label>
          <Input
            ref={register()}
            name="alert.name"
            id="alert-name"
            type="text"
            placeholder="Name to identify alert rule"
          />
        </div>
        <div className={styles.inputWrapper}>
          <Label htmlFor="probe-count" description="If">
            Expression
          </Label>
          <div className={styles.horizontallyAligned}>
            <Input
              ref={register()}
              name="alert.probeCount"
              id="probe-count"
              type="number"
              placeholder="#"
              className={styles.numberInput}
            />
            <span className={styles.text}>or more probes report connection errors</span>
          </div>
        </div>
        <div className={styles.inputWrapper}>
          <Label
            description="Expression has to be true for this long for alert to be fired."
            htmlFor="alert-time-quantity"
          >
            For
          </Label>
          <div className={styles.horizontallyAligned}>
            <Input
              ref={register()}
              name="alert.timeCount"
              id="alert-time-quantity"
              placeholder="#"
              className={styles.numberInput}
            />
            <Controller
              as={Select}
              name="alert.timeUnit"
              options={TIME_UNIT_OPTIONS}
              className={styles.select}
              defaultValue={TIME_UNIT_OPTIONS[1]}
            />
          </div>
        </div>
        <div className={styles.severityContainer}>
          <Label>Severity</Label>
          <Controller as={Select} name="alert.severity" options={ALERTING_SEVERITY_OPTIONS} className={styles.select} />
        </div>
        <AlertLabels />
        <AlertAnnotations />
      </div>
    </Collapse>
  );
};
