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
import { ExpressionField } from './ExpressionField';
import { PromqlExpression } from './PromqlExpression';

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
    margin-bottom: ${theme.spacing.sm};
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
  halfWidth: css`
    width: 50%;
  `,
});

export const Alerting: FC<Props> = ({ editing, alertRules }) => {
  const [showAlerting, setShowAlerting] = useState(false);
  const { instance } = useContext(InstanceContext);
  const { register, watch, errors, control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'alerts' });
  const styles = useStyles(getStyles);
  const alertingUiUrl = `a/grafana-alerting-ui-app/?tab=rules&rulessource=${instance.metrics?.name}`;
  const job = watch('job');

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

  // if (alertRules.length && editing) {
  //   return (
  //     <Collapse label="Alerting" onToggle={() => setShowAlerting(!showAlerting)} isOpen={showAlerting} collapsible>
  //       <div className={styles.container}>
  //         <p>
  //           {alertRules.length} alert{alertRules.length > 1 ? 's are' : ' is'} tied to this check. Edit this check's
  //           alerts in the <code>syntheticmonitoring &gt; {checkId}</code> section of{' '}
  //           <a href={alertingUiUrl} className={styles.link}>
  //             Grafana Cloud Alerting
  //           </a>
  //         </p>
  //       </div>
  //     </Collapse>
  //   );
  // }

  return (
    <Collapse label="Alerting" onToggle={() => setShowAlerting(!showAlerting)} isOpen={showAlerting} collapsible>
      <p className={styles.subheader}>
        Set up alerts for this check here. You must visit{' '}
        <a href={alertingUiUrl} className={styles.link}>
          Grafana Cloud Alerting
        </a>
        &nbsp; to edit this alert and add receivers. Learn more about alert conditions and receivers in{' '}
        <a href={'https://grafana.com/docs/grafana-cloud/alerts/grafana-cloud-alerting/'}>
          Grafana Cloud documentation
        </a>
        .
      </p>
      {fields.map((field, index) => {
        return (
          <div key={field.id} className={styles.container}>
            <Label htmlFor={`alert-name-${index}`}>Alert name</Label>
            <Field className={styles.halfWidth} invalid={errors?.alerts?.[index]?.name}>
              <Input
                ref={register({ required: true })}
                name={`alerts[${index}].name`}
                id={`alert-name-${index}`}
                type="text"
                placeholder="Name to identify alert rule"
                defaultValue={field.name}
              />
            </Field>
            <ExpressionField editing={editing && Boolean(alertRules.length)} field={field} index={index} />
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
            <PromqlExpression alertingUiUrl={alertingUiUrl} index={index} />
            <AlertLabels index={index} />
            <AlertAnnotations index={index} />
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
        onClick={() => append({ name: job, timeCount: 5, timeUnit: TIME_UNIT_OPTIONS[1], probeCount: 1 })}
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
