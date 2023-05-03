import { Button, Field, Input, useStyles2 } from '@grafana/ui';
import React from 'react';
import { CodeEditor } from './CodeEditor';
import { Controller, useForm } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

const DEFAULT_SCRIPT = `import { sleep } from 'k6'
import http from 'k6/http'

export default function main() {
  let response = http.get('https://www.grafana.com')
  sleep(1)
}`;

interface Props {
  onSubmit: (values: any, errors: any) => void;
  script?: string;
}

interface ScriptedFormValues {
  name: string;
  script: string;
}

function getStyles(theme: GrafanaTheme2) {
  return {
    headerContainer: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
    `,
  };
}

export function ScriptedCheckCodeEditor({ onSubmit, script }: Props) {
  const { handleSubmit, register, control } = useForm<ScriptedFormValues>({
    defaultValues: {
      script: script ?? DEFAULT_SCRIPT,
    },
  });
  const styles = useStyles2(getStyles);

  const submit = (values: any) => {
    console.log(values);
    onSubmit(values, null);
  };

  return (
    <form onSubmit={handleSubmit(submit)}>
      <div className={styles.headerContainer}>
        <Field label="Check name">
          <Input {...register('name')} />
        </Field>
        <Button type="submit">Save</Button>
      </div>
      <Controller
        name="script"
        control={control}
        render={({ field: { ...field } }) => {
          return <CodeEditor {...field} />;
        }}
      />
    </form>
  );
}
