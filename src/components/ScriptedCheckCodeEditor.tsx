import { Button, Field, Input, useStyles2 } from '@grafana/ui';
import React from 'react';
import { CodeEditor } from './CodeEditor';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { ProbeOptions } from './CheckEditor/ProbeOptions';
import { CheckType } from 'types';

const DEFAULT_SCRIPT = `import { sleep } from 'k6'
import http from 'k6/http'

export default function main() {
  let response = http.get('https://www.grafana.com')
  sleep(1)
}`;

interface Props {
  onSubmit: (values: any, errors: any) => void;
  saving: boolean;
  script?: string;
}

interface ScriptedFormValues {
  name: string;
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
    probeOptionsContainer: css`
      margin-bottom: ${theme.spacing(4)};
    `,
  };
}

export function ScriptedCheckCodeEditor({ onSubmit, script, saving }: Props) {
  const formMethods = useForm<ScriptedFormValues>({
    defaultValues: {
      script: script ?? DEFAULT_SCRIPT,
      probes: [],
      timeout: 120,
      frequency: 120,
    },
  });
  const { handleSubmit, register, control } = formMethods;
  const styles = useStyles2(getStyles);

  const submit = (values: any) => {
    console.log(values);
    onSubmit(values, null);
  };

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={handleSubmit(submit)}>
        <div className={styles.headerContainer}>
          <Field label="Check name">
            <Input {...register('name')} />
          </Field>

          <Button type="submit" disabled={saving}>
            Save
          </Button>
        </div>
        <div className={styles.probeOptionsContainer}>
          <ProbeOptions isEditor frequency={120} timeout={120000} checkType={CheckType.SCRIPTED} />
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
