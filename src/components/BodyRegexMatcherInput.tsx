import React, { FC } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { css } from 'emotion';
import { Field, Input, IconButton, HorizontalGroup, Icon, Button, useTheme } from '@grafana/ui';

interface Props {
  isEditor: boolean;
  name: string;
  label: string;
  description: string;
}

export const BodyRegexMatcherInput: FC<Props> = ({ isEditor, name, label, description }) => {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  const theme = useTheme();
  return (
    <Field label={label} description={description} disabled={!isEditor}>
      <div>
        <div
          className={css`
            margin-bottom: ${theme.spacing.sm};
            display: flex;
            flex-direction: column;
          `}
        >
          {fields.map((field, index) => (
            <div
              key={field.id}
              className={css`
                margin-bottom: ${theme.spacing.sm};
              `}
            >
              <HorizontalGroup>
                <Input
                  ref={register()}
                  type="text"
                  name={`${name}[${index}]`}
                  placeholder="regexp"
                  disabled={!isEditor}
                />
                <IconButton name="minus-circle" type="button" disabled={!isEditor} onClick={() => remove(index)} />
              </HorizontalGroup>
            </div>
          ))}
        </div>
        <Button type="button" onClick={() => append({ value: '' })} disabled={!isEditor} variant="secondary" size="sm">
          <HorizontalGroup spacing="sm">
            <Icon name="plus" />
            Add Body Regexp
          </HorizontalGroup>
        </Button>
      </div>
    </Field>
  );
};
