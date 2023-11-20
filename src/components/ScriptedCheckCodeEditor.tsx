import React, { useContext, useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, Field, Input, Spinner, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckType } from 'types';
import { ChecksContext } from 'contexts/ChecksContext';
import { InstanceContext } from 'contexts/InstanceContext';

import { ProbeOptions } from './CheckEditor/ProbeOptions';
import { CodeEditor } from './CodeEditor';
import { HorizontalCheckboxField } from './HorizonalCheckboxField';

const DEFAULT_SCRIPT = `import { sleep } from 'k6'
import http from 'k6/http'

export default function main() {
  let response = http.get('https://www.grafana.com')
  sleep(1)
}`;

interface Props {
  onSubmit?: (values: any, errors: any) => Promise<any>;
  saving?: boolean;
  script?: string;
  checkId?: string;
}

export interface ScriptedFormValues {
  job: string;
  target: string;
  enabled: boolean;
  script: string;
  probes: number[];
  timeout: number;
  frequency: number;
}

function getStyles(theme: GrafanaTheme2) {
  return {
    headerContainer: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
    `,
    flexCol: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1)};
      width: 100%;
    `,
    saveButton: css`
      /* align-self: flex-start; */
      position: fixed;
      bottom: ${theme.spacing(2)};
      right: ${theme.spacing(2)};
      z-index: ${theme.zIndex.portal};
    `,
    form: css`
      width: 100%;
    `,
    probeOptionsContainer: css`
      margin-bottom: ${theme.spacing(4)};
    `,
  };
}

export function ScriptedCheckCodeEditor({ onSubmit, script, saving, checkId }: Props) {
  const { instance } = useContext(InstanceContext);
  const { scriptedChecks: checks } = useContext(ChecksContext);
  let defaultValues = {
    script: script ?? DEFAULT_SCRIPT,
    probes: [] as number[],
    enabled: true,
    timeout: 30,
    frequency: 120,
    job: '',
    target: '',
  };

  if (checkId) {
    const check = checks.find((c) => c.id === Number(checkId));
    if (check) {
      defaultValues = {
        script: atob(check.settings.k6?.script ?? ''),
        probes: check.probes,
        enabled: check.enabled,
        timeout: check.timeout,
        frequency: check.frequency / 1000,
        job: check.job,
        target: check.target,
      };
    }
  }

  const formMethods = useForm<ScriptedFormValues>({
    defaultValues,
  });
  const { handleSubmit, register, control } = formMethods;
  const styles = useStyles2(getStyles);
  const [submissionError, setSubmissionError] = useState<string | undefined>();

  const submit = ({ frequency, timeout, script, ...rest }: ScriptedFormValues) => {
    setSubmissionError(undefined);
    const check = checks.find((c) => c.id === Number(checkId));
    const updatedCheck = {
      ...(check ?? {}),
      ...rest,
      frequency: frequency * 1000,
      timeout: timeout * 1000,
      labels: [],
      basicMetricsOnly: true,
      alertSensitivity: '',
      settings: {
        k6: {
          script: btoa(script),
        },
      },
    };
    if (checkId) {
      return instance.api?.updateCheck(updatedCheck).finally(() => console.log('done'));
    } else {
      return instance.api?.addCheck(updatedCheck).finally(() => console.log('done'));
    }
  };

  return (
    <FormProvider {...formMethods}>
      {submissionError && (
        <Alert severity="error" title="Submission error">
          {submissionError}
        </Alert>
      )}
      <Button type="submit" disabled={saving} className={styles.saveButton}>
        {saving ? <Spinner /> : 'Save'}
      </Button>
      <form onSubmit={handleSubmit(submit)} className={styles.form}>
        <div className={styles.headerContainer}>
          <div className={styles.flexCol}>
            <Field label="Job name">
              <Input {...register('job')} />
            </Field>
            <Field label="Target">
              <Input {...register('target')} />
            </Field>
            <HorizontalCheckboxField
              name="enabled"
              id="check-form-enabled"
              label="Enabled"
              description="If a check is enabled, metrics and logs are published to your Grafana Cloud stack."
            />
          </div>
        </div>
        <div className={styles.probeOptionsContainer}>
          <ProbeOptions isEditor frequency={120} timeout={30000} checkType={CheckType.K6} />
        </div>
        <Controller
          name="script"
          control={control}
          render={({ field: { ...field } }) => {
            return <CodeEditor {...field} />;
          }}
        />
      </form>
    </FormProvider>
  );
}
