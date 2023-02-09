import { GrafanaTheme2 } from '@grafana/data';
import { ClipboardButton, Field, HorizontalGroup, useStyles2 } from '@grafana/ui';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { SettingsFormValues } from 'types';
import { VariableType } from './MultiHttpTypes';
import { css } from '@emotion/css';

interface Props {
  index: number;
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css`
      margin-top: ${theme.spacing(1)};
    `,
  };
}

export function AvailableVariables({ index }: Props) {
  const styles = useStyles2(getStyles);
  const { watch } = useFormContext();
  const settings = (watch('settings') as SettingsFormValues) ?? {};
  const availableVars =
    settings.multihttp?.entries?.reduce<VariableType[]>((acc, entry, requestIndex) => {
      if (index > requestIndex) {
        return acc.concat(entry.variables ?? []);
      }
      return acc;
    }, []) ?? [];

  if (availableVars.length < 1) {
    return null;
  }

  return (
    <Field label="Available variables">
      <div className={styles.container}>
        {availableVars.map((variable, i) => {
          return (
            <ClipboardButton
              key={i}
              getText={() => '${' + variable.name + '}'}
              variant="secondary"
              fill="text"
              icon="copy"
            >{`\$\{${variable.name}\}`}</ClipboardButton>
          );
        })}
      </div>
    </Field>
  );
}
