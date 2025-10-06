import React, { useMemo } from 'react';
import { ClipboardButton, Stack } from '@grafana/ui';

import { useMultiHttpVariables } from '../../hooks/useMultiHttpVariables';
import { StyledField } from '../ui/StyledField';

interface FormMultiHttpAvailableVariablesProps {
  requestIndex: number;
}
export function MultiHttpAvailableVariables({ requestIndex }: FormMultiHttpAvailableVariablesProps) {
  const variables = useMultiHttpVariables();

  const availableVariables = useMemo(() => {
    return variables.slice(0, requestIndex).flat();
  }, [requestIndex, variables]);

  const hasValidVariables = availableVariables.length > 0;
  if (!hasValidVariables) {
    return null;
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <StyledField label="Available variables" emulate>
        <div />
      </StyledField>
      <Stack wrap="wrap" gap={1}>
        {availableVariables.map(({ type, name }, index) => {
          const variableName = '${' + name + '}';
          return (
            <ClipboardButton
              variant="secondary"
              key={`${index}.${type}.${name}`}
              aria-label={`Copy variable '${name}' to clipboard`}
              size="sm"
              getText={() => variableName}
              data-fs-element="Copy variable to clipboard button"
            >
              {variableName}
            </ClipboardButton>
          );
        })}
      </Stack>
    </div>
  );
}
