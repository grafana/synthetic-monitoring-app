import React, { FC, useState } from 'react';
import { css } from 'emotion';
import { GrafanaTheme } from '@grafana/data';
import { Input, Label, Select, useStyles } from '@grafana/ui';
import { Collapse } from './Collapse';
import { Controller } from 'react-hook-form';
import { TIME_UNIT_OPTIONS } from './constants';

interface Props {}

const getStyles = (theme: GrafanaTheme) => ({
  subheader: css`
    margin-top: ${theme.spacing.md};
    & a {
      text-decoration: underline;
    }
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
});

export const Alerting: FC<Props> = () => {
  const [showAlerting, setShowAlerting] = useState(false);
  const styles = useStyles(getStyles);
  return (
    <Collapse label="Alerting" onToggle={() => setShowAlerting(!showAlerting)} isOpen={showAlerting} collapsible>
      <p className={styles.subheader}>
        Set up alerts based on criteria that you define. These alerts can be accessed and edited here or in the{' '}
        <a href="FIXME">Grafana Cloud Alerting UI</a>.
      </p>
      <div className={styles.container}>
        <div className={styles.inputWrapper}>
          <Label htmlFor="alert-name">Alert name</Label>
          <Input id="alert-name" type="text" />
        </div>
        <div className={styles.inputWrapper}>
          <Label htmlFor="probe-count" description="If">
            Expression
          </Label>
          <div className={styles.horizontallyAligned}>
            <Input id="probe-count" type="number" className={styles.numberInput} />
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
            <Input id="alert-time-quantity" className={styles.numberInput} />
            <Controller as={Select} name="alert.timeUnit" options={TIME_UNIT_OPTIONS} className={styles.select} />
          </div>
        </div>
        <div>
          <Label>Severity</Label>
          <Controller as={Select} name="alert.severity" options={[]} className={styles.select} />
        </div>
      </div>
    </Collapse>
  );
};
