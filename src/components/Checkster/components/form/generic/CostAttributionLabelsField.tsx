import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Input, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValues } from 'types';

import { StyledField } from '../../ui/StyledField';

const CAL_DESCRIPTION =
  'Cost attribution labels help track costs across teams and services. These labels are required and will be set on all checks. Choose from the list or type your own value.';

interface CostAttributionLabelsFieldProps {
  calNames: string[];
}

export function CostAttributionLabelsField({ calNames }: CostAttributionLabelsFieldProps) {
  const {
    formState: { disabled },
  } = useFormContext<CheckFormValues>();
  const styles = useStyles2(getStyles);

  if (calNames.length === 0) {
    return null;
  }

  return (
    <StyledField label="Cost attribution labels" description={CAL_DESCRIPTION} required emulate>
      {/* @ts-expect-error Totally valid spacing value */}
      <Stack direction="column" gap={0.75}>
        {calNames.map((calName, index) => (
          <Stack key={calName} alignItems="start">
            <StyledField className={styles.nameField}>
              <Input value={calName} readOnly aria-label={`Cost attribution label ${index + 1} name`} />
            </StyledField>
            <StyledField className={styles.valueField}>
              <Controller
                name={`labels.${index}.value`}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder="unattributed"
                    disabled={disabled}
                    aria-label={`Cost attribution label ${index + 1} value`}
                  />
                )}
              />
            </StyledField>
          </Stack>
        ))}
      </Stack>
    </StyledField>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    nameField: css`
      flex-grow: 1;
    `,
    valueField: css`
      flex-grow: 1;
    `,
  };
}
