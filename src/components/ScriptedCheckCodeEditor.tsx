import React, { useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, Field, Input, Spinner, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckType, ROUTES } from 'types';
import { useNavigation } from 'hooks/useNavigation';

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
  onSubmit: (values: any, errors: any) => Promise<any>;
  saving: boolean;
  script?: string;
}

export interface ScriptedFormValues {
  name: string;
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
    `,
    saveButton: css`
      align-self: flex-start;
    `,
    probeOptionsContainer: css`
      margin-bottom: ${theme.spacing(4)};
    `,
  };
}

export function ScriptedCheckCodeEditor({ onSubmit, script, saving }: Props) {
  const navigate = useNavigation();
  const formMethods = useForm<ScriptedFormValues>({
    defaultValues: {
      script: script ?? DEFAULT_SCRIPT,
      probes: [],
      enabled: true,
      timeout: 30,
      frequency: 120,
    },
  });
  const { handleSubmit, register, control } = formMethods;
  const styles = useStyles2(getStyles);
  const [submissionError, setSubmissionError] = useState<string | undefined>();

  const submit = (values: any) => {
    setSubmissionError(undefined);
    return onSubmit(values, null)
      .then(() => {
        navigate(ROUTES.ScriptedChecks);
      })
      .catch((e) => {
        console.log(e);
        setSubmissionError(e.data?.err ?? e.message);
      });
  };

  return (
    <FormProvider {...formMethods}>
      {submissionError && (
        <Alert severity="error" title="Submission error">
          {submissionError}
        </Alert>
      )}
      <form onSubmit={handleSubmit(submit)}>
        <div className={styles.headerContainer}>
          <div className={styles.flexCol}>
            <Field label="Job name">
              <Input {...register('name')} />
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

          <Button type="submit" disabled={saving} className={styles.saveButton}>
            {saving ? <Spinner /> : 'Save'}
          </Button>
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
