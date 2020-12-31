import React, { FC } from 'react';
import { css } from 'emotion';
import { GrafanaTheme } from '@grafana/data';
import { Input, Label, useStyles } from '@grafana/ui';
import { useFormContext } from 'react-hook-form';

const getStyles = (theme: GrafanaTheme) => ({
  link: css`
    text-decoration: underline;
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
  unsetMaxWidth: css`
    max-width: unset;
  `,
  displayNone: css`
    display: none;
  `,
});

interface Props {
  alertingUiUrl: string;
  index: number;
}

export const PromqlExpression: FC<Props> = ({ alertingUiUrl, index }) => {
  const styles = useStyles(getStyles);
  const { watch, register } = useFormContext();
  const job = watch('job');
  const target = watch('target');
  const probeCount = watch(`alerts[${index}].probeCount`);
  const expression = watch(`alerts[${index}].expression`);

  const promqlAlertingExp =
    expression ??
    `sum(1 - probe_success{job="${job}", instance="${target}"}) by (job, instance) >= ${probeCount ||
      `<value not selected>`}`;

  return (
    <div className={styles.promqlSection}>
      <Label
        className={styles.unsetMaxWidth}
        description={
          <p>
            This alert will appear as promQL in the{' '}
            <a className={styles.link} href={alertingUiUrl}>
              Grafana Cloud Alerting.
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
      {expression && (
        <Input className={styles.displayNone} ref={register()} name={`alerts[${index}].expression`} hidden />
      )}
      <code className={styles.promql}>{promqlAlertingExp}</code>
    </div>
  );
};
