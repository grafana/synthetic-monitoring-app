import React, { useEffect } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { FieldValidationMessage, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { CheckFormFieldPath } from '../../../types';
import { CheckFormValues, K6Channel } from 'types';
import { useSvalinnScript } from 'hooks/useSvalinnScript';
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
    getValues,
    setValue,
    formState: { errors, disabled },
  } = useFormContext<CheckFormValues>();

  const { script, enabled } = useSvalinnScript();

  useEffect(() => {
    if (enabled) {
      setValue(field as any, 'Loading script...');
    }
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (script !== null) {
      setValue(field as any, script);
    }
  }, [script]); // eslint-disable-line react-hooks/exhaustive-deps

  const fieldErrorProps = getFieldErrorProps(errors, field);
  
  const theme = useTheme2();

  const k6ChannelId = (getValues('channels.k6') as K6Channel | undefined)?.id;

  const { field: fieldProps } = useController({ control, name: field });

  return (
    <Column
      grow
      className={cx(
        css`
          & > div:first-child {
            flex: 1 1 0;
            overflow: visible;
          }
          & > div > div {
            min-height: unset; // code editor
          }
        `
      )}
    >
      <CodeEditor
        {...(fieldProps as any)}
        readOnly={disabled}
        data-form-name={field}
        data-form-element-selector="textarea"
        k6Channel={k6ChannelId}
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
