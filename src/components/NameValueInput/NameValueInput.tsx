import React, { useRef } from 'react';
import { FieldErrorsImpl, useFieldArray, useFormContext } from 'react-hook-form';
import { Button, Field, HorizontalGroup, Icon, IconButton, Input, useTheme2, VerticalGroup } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValues, Probe } from 'types';
import { isHttpErrors } from 'utils.types';

type NameValueName = 'settings.http.headers' | 'settings.http.proxyConnectHeaders' | 'labels';

interface Props {
  name: NameValueName;
  limit?: number;
  disabled?: boolean;
  label: string;
  validateName?: (name: string) => string | undefined;
  validateValue?: (value: string) => string | undefined;
}

function getErrors(errors: FieldErrorsImpl<CheckFormValues | Probe>, name: NameValueName) {
  if (name === 'labels') {
    return errors?.labels;
  }
  if (isHttpErrors(errors)) {
    if (name === 'settings.http.headers') {
      return errors?.settings?.http?.headers;
    }
    if (name === 'settings.http.proxyConnectHeaders') {
      return errors?.settings?.http?.proxyConnectHeaders;
    }
  }
  return undefined;
}

export const NameValueInput = ({ name, disabled, limit, label, validateName, validateValue }: Props) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CheckFormValues | Probe>();
  const addRef = useRef<HTMLButtonElement>(null);
  const { fields, append, remove } = useFieldArray({ control, name });
  const theme = useTheme2();

  const fieldError = getErrors(errors, name);

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
            required
          >
            <Input
              {...register(`${name}.${index}.name`, { required: true, validate: validateName })}
              aria-label={`Label ${index + 1} name `}
              data-testid={`${label}-name-${index}`}
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
            required
          >
            <Input
              {...register(`${name}.${index}.value`, { required: true, validate: validateValue })}
              aria-label={`Label ${index + 1} value `}
              data-testid={`${label}-value-${index}`}
              type="text"
              placeholder="value"
              disabled={disabled}
            />
          </Field>
          <IconButton
            className={css`
              margin-top: ${theme.spacing(2)};
            `}
            name="minus-circle"
            type="button"
            onClick={() => {
              remove(index);
              requestAnimationFrame(() => {
                addRef.current?.focus();
              });
            }}
            disabled={disabled}
            tooltip="Delete"
          />
        </HorizontalGroup>
      ))}
      {(limit === undefined || fields.length < limit) && (
        <Button
          onClick={() => append({ name: '', value: '' })}
          disabled={disabled}
          variant="secondary"
          size="sm"
          type="button"
          ref={addRef}
        >
          <Icon name="plus" />
          &nbsp; Add {label}
        </Button>
      )}
    </VerticalGroup>
  );
};
