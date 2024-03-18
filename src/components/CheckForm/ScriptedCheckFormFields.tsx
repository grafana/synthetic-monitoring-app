import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Field, Icon, Input, Label, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValuesScripted, CheckType } from 'types';
import { validateTarget } from 'validation';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { CodeEditor } from 'components/CodeEditor';
import { LabelField } from 'components/LabelField';
import { ScriptExamplesMenu } from 'components/ScriptExamplesMenu/ScriptExamplesMenu';

export const ScriptedCheckFormFields = () => {
  const { control, formState, register, setValue, getValues } = useFormContext<CheckFormValuesScripted>();
  const styles = useStyles2(getStyles);
  const id = getValues('id');

  return (
    <>
      <Field
        label={
          <Label htmlFor="target">
            Instance&nbsp;
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
        <Input
          id="target"
          {...register('target', {
            required: { value: true, message: 'Instance is required' },
            validate: (value) => validateTarget(CheckType.Scripted, value),
          })}
        />
      </Field>

      <ProbeOptions checkType={CheckType.Scripted} />
      <LabelField<CheckFormValuesScripted> />
      {!id && <ScriptExamplesMenu onSelectExample={(script) => setValue('settings.scripted.script', script)} />}
      <Controller
        name="settings.scripted.script"
        control={control}
        render={({ field }) => {
          return <CodeEditor {...field} />;
        }}
      />
    </>
  );
};

function getStyles(theme: GrafanaTheme2) {
  return {
    infoIcon: css({
      fontWeight: theme.typography.fontWeightLight,
    }),
  };
}
