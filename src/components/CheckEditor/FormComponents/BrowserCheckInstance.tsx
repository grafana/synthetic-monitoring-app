import React from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Field, Icon, Input, Label, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValuesBrowser } from 'types';

export const BrowserCheckInstance = () => {
  const { formState, register } = useFormContext<CheckFormValuesBrowser>();

  const styles = useStyles2(getStyles);

  return (
    <Field
      label={
        <Label htmlFor="target">
          Instance&nbsp;*&nbsp;
          <Tooltip
            content={
              <span>
                Metrics and logs produced as a result of this check will follow the Prometheus convention of being
                identified by a job and instance. The job/instance pair is guaranteed unique and the method by which
                results are queried. Read more about the job/instance convention at prometheus.io
              </span>
            }
          >
            <Icon name="info-circle" className={styles.infoIcon} />
          </Tooltip>
        </Label>
      }
      invalid={Boolean(formState.errors.target)}
      error={formState.errors.target?.message}
      required
    >
      <Input id="target" {...register('target')} disabled={formState.disabled} />
    </Field>
  );
};

function getStyles(theme: GrafanaTheme2) {
  return {
    infoIcon: css({
      fontWeight: theme.typography.fontWeightLight,
    }),
  };
}
