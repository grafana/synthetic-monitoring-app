import React from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { ClipboardButton, Field, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValuesMultiHttp } from 'types';

import { MultiHttpVariable } from './MultiHttpTypes';

interface Props {
  index: number;
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css`
      margin-top: ${theme.spacing(1)};
      display: flex;
      gap: ${theme.spacing(1)};
    `,
  };
}

export function AvailableVariables({ index }: Props) {
  const styles = useStyles2(getStyles);
  const { watch } = useFormContext<CheckFormValuesMultiHttp>();
  const settings: CheckFormValuesMultiHttp['settings'] = watch('settings');
  const availableVars =
    settings.multihttp.entries.reduce<MultiHttpVariable[]>((acc, entry, requestIndex) => {
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
          const variableText = '${' + variable.name + '}';
          return (
            <ClipboardButton
              key={i}
              getText={() => variableText}
              variant="secondary"
              fill="outline"
              icon="copy"
              data-fs-element="Copy variable to clipboard button"
            >
              {variableText}
            </ClipboardButton>
          );
        })}
      </div>
    </Field>
  );
}
