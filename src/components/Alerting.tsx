import React, { FC, useState, useContext } from 'react';
import { css } from 'emotion';
import { GrafanaTheme } from '@grafana/data';
import { Button, Field, Icon, Input, Label, Select, useStyles } from '@grafana/ui';
import { Collapse } from './Collapse';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
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
    margin-bottom: ${theme.spacing.md};
  `,
  icon: css`
    margin-right: ${theme.spacing.xs};
  `,
  inputWrapper: css`
    margin-bottom: ${theme.spacing.md};
  `,
  numberInput: css`
    max-width: 72px;
    margin: 0 ${theme.spacing.sm};
  `,
  horizontallyAligned: css`
    display: flex;
    align-items: center;
  `,
  horizontalFlexRow: css`
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
  promql: css`
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    color: ${theme.colors.textWeak};
    font-size: ${theme.typography.size.md};
    display: block;
    width: 100%;
  `,
  promqlSection: css`
    margin-bottom: ${theme.spacing.md};
  `,
  deleteButton: css`
    display: flex;
    justify-content: flex-end;
  `,
  clearMarginBottom: css`
    margin-bottom: 0;
  `,
});

export const Alerting: FC<Props> = ({ alertRules, editing, checkId }) => {
  const [showAlerting, setShowAlerting] = useState(false);
  const { instance } = useContext(InstanceContext);
  const { register, watch, errors, control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'alerts' });
  const styles = useStyles(getStyles);
  const alertingUiUrl = `a/grafana-alerting-ui-app/?tab=rules&rulessource=${instance.metrics?.name}`;
  const probeCount = watch('probes').length;
  const alerts = watch('alerts');
  const job = watch('job');
  const target = watch('target');

  if (!instance.alertRuler) {
    return (
      <Collapse label="Alerting" onToggle={() => setShowAlerting(!showAlerting)} isOpen={showAlerting} collapsible>
        <div className={styles.container}>
          <p>
            <Icon className={styles.icon} name="exclamation-triangle" />
            Synthetic Monitoring uses &nbsp;
            <a href="https://grafana.com/docs/grafana-cloud/alerts/grafana-cloud-alerting/" className={styles.link}>
              Grafana Cloud Alerting
            </a>
            , which is not accessible for Grafana instances running on-prem. Alert rules can be added to new or existing
            checks in &nbsp;
            <a href="https://grafana.com" className={styles.link}>
              Grafana Cloud.
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
            <a href={alertingUiUrl} className={styles.link}>
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
        <a href={alertingUiUrl} className={styles.link}>
          Alerting UI
        </a>
        .
      </p>
      {fields.map((field, index) => {
        const promqlAlertingExp = `sum(1 - probe_success{job="${job}", instance="${target}"}) by (job, instance) >= ${alerts[
          index
        ].probeCount || `<value not selected>`}`;
        return (
          <div key={field.id} className={styles.container}>
            <div className={styles.inputWrapper}>
              <Label htmlFor={`alert-name-${index}`}>Alert name</Label>
              <Field invalid={errors?.alerts?.[index]?.name}>
                <Input
                  ref={register({ required: true })}
                  name={`alerts[${index}].name`}
                  id={`alert-name-${index}`}
                  type="text"
                  placeholder="Name to identify alert rule"
                  defaultValue={field.name}
                />
              </Field>
            </div>
            <Label>Expression</Label>
            <div className={styles.horizontalFlexRow}>
              <div className={styles.horizontallyAligned}>
                <span className={styles.text}>An alert will fire if</span>
                <Field
                  className={styles.clearMarginBottom}
                  invalid={errors?.alerts?.[index]?.probeCount}
                  error={errors?.alerts?.[index]?.probeCount?.message}
                  horizontal
                >
                  <Input
                    ref={register({
                      required: true,
                      max: { value: probeCount, message: `There are ${probeCount} probes configured for this check` },
                    })}
                    name={`alerts[${index}].probeCount`}
                    id={`probe-count-${index}`}
                    type="number"
                    placeholder="number"
                    className={styles.numberInput}
                    defaultValue={field.probeCount}
                  />
                </Field>

                <span className={styles.text}>or more probes report connection errors for</span>
              </div>

              <Field
                className={styles.clearMarginBottom}
                invalid={errors?.alerts?.[index]?.timeCount}
                error={errors?.alerts?.[index]?.timeCount}
                horizontal
              >
                <Input
                  type={'number'}
                  ref={register({ required: true })}
                  name={`alerts[${index}].timeCount`}
                  id={`alert-time-quantity-${index}`}
                  placeholder="number"
                  className={styles.numberInput}
                  defaultValue={field.timeCount}
                />
              </Field>
              <Controller
                as={Select}
                name={`alerts[${index}].timeUnit`}
                options={TIME_UNIT_OPTIONS}
                className={styles.select}
                defaultValue={TIME_UNIT_OPTIONS[1]}
              />
            </div>
            <div className={styles.severityContainer}>
              <Label>Severity</Label>
              <Controller
                as={Select}
                name={`alerts[${index}].severity`}
                options={ALERTING_SEVERITY_OPTIONS}
                className={styles.select}
                defaultValue={ALERTING_SEVERITY_OPTIONS[1]}
              />
            </div>
            <div className={styles.promqlSection}>
              <Label
                description={
                  <p>
                    This alert will appear as promQL in the{' '}
                    <a className={styles.link} href={alertingUiUrl}>
                      Alerting UI.
                    </a>{' '}
                    If you prefer to write alerts in promQL, you can do so from the Alerting UI.{' '}
                    <a href={'https://prometheus.io/docs/prometheus/latest/querying/basics/'} className={styles.link}>
                      Learn more about PromQL.
                    </a>
                  </p>
                }
              >
                PromQL preview
              </Label>
              <code className={styles.promql}>{promqlAlertingExp}</code>
            </div>
            <AlertLabels />
            <AlertAnnotations />
            <div className={styles.deleteButton}>
              <Button onClick={() => remove(index)} size="sm" variant="destructive" type="button">
                <Icon name="trash-alt" />
                &nbsp; Remove alert rule
              </Button>
            </div>
          </div>
        );
      })}
      <Button
        onClick={() => append({ name: job, timeCount: 5, probeCount: 1 })}
        variant="secondary"
        size="sm"
        type="button"
      >
        <Icon name="plus" />
        &nbsp; Add alert rule
      </Button>
    </Collapse>
  );
};
