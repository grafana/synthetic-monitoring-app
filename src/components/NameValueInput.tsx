import React from 'react';
import { css } from '@emotion/css';
import { HorizontalGroup, Input, IconButton, VerticalGroup, Icon, Button, Field, useTheme } from '@grafana/ui';
import { useFieldArray, useFormContext } from 'react-hook-form';

interface Props {
  name: string;
  limit: number;
  disabled?: boolean;
  label: string;
  validateName?: (name: string) => string | undefined;
  validateValue?: (value: string) => string | undefined;
}

export const NameValueInput = ({ name, disabled, limit, label, validateName, validateValue }: Props) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  const theme = useTheme();
  const fieldError = name
    .split('.')
    .reduce((nestedError, errorPathFragment) => nestedError?.[errorPathFragment], errors);
  return (
    <VerticalGroup justify="space-between">
      {fields.map((field, index) => (
        <HorizontalGroup key={field.id} align="flex-start">
          <Field
            invalid={Boolean(fieldError?.[index]?.name?.type)}
            error={fieldError?.[index]?.name?.message}
            className={css`
              margin-bottom: 0;
            `}
          >
            <Input
              {...register(`${name}.${index}.name` as const, { required: true, validate: validateName })}
              type="text"
              placeholder="name"
              disabled={disabled}
            />
          </Field>
          <Field
            invalid={Boolean(fieldError?.[index]?.value)}
            error={fieldError?.[index]?.value?.message}
            className={css`
              margin-bottom: 0;
            `}
          >
            <Input
              {...register(`${name}.${index}.value` as const, { required: true, validate: validateValue })}
              type="text"
              placeholder="value"
              disabled={disabled}
            />
          </Field>
          <IconButton
            className={css`
              margin-top: ${theme.spacing.sm};
            `}
            name="minus-circle"
            type="button"
            onClick={() => remove(index)}
            disabled={disabled}
          />
        </HorizontalGroup>
      ))}
      {fields.length < limit && (
        <Button
          onClick={() => append({ name: '', value: '' })}
          disabled={disabled}
          variant="secondary"
          size="sm"
          type="button"
        >
          <Icon name="plus" />
          &nbsp; Add {label}
        </Button>
      )}
    </VerticalGroup>
  );
};
