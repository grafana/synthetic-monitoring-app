import React, { useEffect, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Alert, FieldValidationMessage, Spinner, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { CheckFormFieldPath } from '../../../types';
import { CheckFormValues, K6Channel } from 'types';
import { CodeEditor } from 'components/CodeEditor';

import { useChecksterContext } from '../../../contexts/ChecksterContext';
import { getFieldErrorProps } from '../../../utils/form';
import { Column } from '../../ui/Column';

const THINKING_PHRASES = [
  'Generating your script...',
  'Analysing the incident...',
  'Crafting the perfect test...',
  'Teaching the AI what a k6 script looks like...',
  'Bribing the model with compute cycles...',
  'Untangling your stack traces...',
  'Turning incidents into assertions...',
  'Almost there...',
  'Still thinking, promise...',
  'Good things take time. Bad things take longer. This is a good thing.',
];

function useThinkingPhrase(): string {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % THINKING_PHRASES.length), 20000);
    return () => clearInterval(id);
  }, []);
  return THINKING_PHRASES[index];
}

interface GenericScriptFieldProps {
  field: CheckFormFieldPath;
}

// FIXME: Not actually a Field (no label, no description), but it has errors!
export function GenericScriptField({ field }: GenericScriptFieldProps) {
  const {
    control,
    getValues,
    formState: { errors, disabled },
  } = useFormContext<CheckFormValues>();

  const { svalinnIsLoading, svalinnError } = useChecksterContext();
  const fieldErrorProps = getFieldErrorProps(errors, field);
  const theme = useTheme2();
  const thinkingPhrase = useThinkingPhrase();

  const k6ChannelId = (getValues('channels.k6') as K6Channel | undefined)?.id;

  const { field: fieldProps } = useController({ control, name: field });

  if (svalinnIsLoading) {
    return (
      <Column
        grow
        className={css`
          align-items: center;
          justify-content: center;
          gap: ${theme.spacing(2)};
          flex-direction: row;
        `}
      >
        <Spinner />
        <span>{thinkingPhrase}</span>
      </Column>
    );
  }

  if (svalinnError) {
    return (
      <Column grow>
        <Alert title={svalinnError} severity="error" />
      </Column>
    );
  }

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
