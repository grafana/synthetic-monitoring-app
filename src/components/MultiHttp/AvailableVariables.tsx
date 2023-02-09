import { Card, HorizontalGroup } from '@grafana/ui';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { CheckFormValues, MultiHttpSettings, MultiHttpVariable, SettingsFormValues } from 'types';
import { MultiHttpEntry, VariableType } from './MultiHttpTypes';

interface Props {
  index: number;
}

export function AvailableVariables({ index }: Props) {
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
    <div>
      {availableVars.map((variable, i) => {
        return (
          <HorizontalGroup key={i}>
            <code>{`\$\{${variable.name}\}`}</code>
          </HorizontalGroup>
        );
      })}
    </div>
  );
}
