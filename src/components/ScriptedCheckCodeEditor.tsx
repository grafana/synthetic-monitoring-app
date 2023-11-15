import React from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Field, Input, useStyles2, VerticalGroup } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckType } from 'types';

import { ProbeOptions } from './CheckEditor/ProbeOptions';
import { CodeEditor } from './CodeEditor';

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

export interface ScriptedFormValues {
  name: string;
  target: string;
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
    saveButton: css`
      align-self: flex-start;
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
          <VerticalGroup spacing="sm">
            <Field label="Job name">
              <Input {...register('name')} />
            </Field>
            <Field label="Target">
              <Input {...register('target')} />
            </Field>
          </VerticalGroup>

          <Button type="submit" disabled={saving} className={styles.saveButton}>
            Save
          </Button>
        </div>
        <div className={styles.probeOptionsContainer}>
          <ProbeOptions isEditor frequency={120} timeout={120000} checkType={CheckType.K6} />
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
