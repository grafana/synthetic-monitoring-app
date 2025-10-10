import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { FieldValidationMessage, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { CheckFormFieldPath } from '../../../types';
import { CheckFormValues } from 'types';
import { CodeEditor } from 'components/CodeEditor';

import { getFieldErrorProps } from '../../../utils/form';
import { Column } from '../../ui/Column';

interface GenericScriptFieldProps {
  field: CheckFormFieldPath;
}

// FIXME: Not actually a Field (no label, no description), but it has errors!
export function GenericScriptField({ field }: GenericScriptFieldProps) {
  const {
    control,
    formState: { errors, disabled },
  } = useFormContext<CheckFormValues>();

  const fieldErrorProps = getFieldErrorProps(errors, field);

  const theme = useTheme2();

  return (
    <Column
      grow
      className={cx(
        css`
          & > div:first-child {
            flex: 1 1 0;
            overflow: auto;
          }
          & > div > div {
            min-height: unset; // code editor
          }
        `
      )}
    >
      <Controller
        control={control}
        name={field}
        render={({ field: fieldProps }) => {
          return <CodeEditor {...(fieldProps as any)} readOnly={disabled} />;
        }}
      />
      {fieldErrorProps.error && (
        <div
          className={css`
            // less visible layout shift ("extends" code editor)
            background-color: ${theme.colors.background.canvas};
            padding: ${theme.spacing(0, 1, 1)};
          `}
        >
          <FieldValidationMessage>{fieldErrorProps.error}</FieldValidationMessage>
        </div>
      )}
    </Column>
  );
}
