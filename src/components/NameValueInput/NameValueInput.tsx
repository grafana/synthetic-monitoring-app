import React, { useRef } from 'react';
import { FieldErrorsImpl, useFieldArray, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Field, HorizontalGroup, Icon, IconButton, Input, useStyles2, VerticalGroup } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValues, Probe } from 'types';
import { isHttpErrors } from 'utils.types';

export type NameValueName = 'settings.http.headers' | 'settings.http.proxyConnectHeaders' | 'labels';

interface Props {
  ariaLabelSuffix?: string;
  name: NameValueName;
  limit?: number;
  disabled?: boolean;
  label: string;
  validateName?: (name: string) => string | undefined;
  validateValue?: (value: string) => string | undefined;
  'data-fs-element'?: string;
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

const getStyles = (theme: GrafanaTheme2) => ({
  addButton: css({ 'margin-top': theme.spacing(1) }),
  field: css({ 'margin-bottom': 0, 'margin-top': theme.spacing(1) }),
});

export const NameValueInput = ({
  ariaLabelSuffix = ``,
  name,
  disabled,
  limit,
  label,
  validateName,
  validateValue,
  ...rest
}: Props) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CheckFormValues | Probe>();
  const addRef = useRef<HTMLButtonElement>(null);
  const { fields, append, remove } = useFieldArray({ control, name });
  const styles = useStyles2(getStyles);

  const fieldError = getErrors(errors, name);

  return (
    <VerticalGroup justify="space-between">
      {fields.map((field, index) => (
        <HorizontalGroup key={field.id} align="center">
          <Field
            invalid={Boolean(fieldError?.[index]?.name?.type)}
            error={fieldError?.[index]?.name?.message}
            className={styles.field}
            required
          >
            <Input
              {...register(`${name}.${index}.name`, { required: true, validate: validateName })}
              aria-label={`${label} ${index + 1} name ${ariaLabelSuffix}`}
              data-testid={`${label}-name-${index}`}
              type="text"
              placeholder="name"
              disabled={disabled}
              data-fs-element={`${rest['data-fs-element']}-name-${index}`}
            />
          </Field>
          <Field
            invalid={Boolean(fieldError?.[index]?.value)}
            error={fieldError?.[index]?.value?.message}
            className={styles.field}
            required
          >
            <Input
              {...register(`${name}.${index}.value`, { required: true, validate: validateValue })}
              aria-label={`${label} ${index + 1} value ${ariaLabelSuffix}`}
              data-testid={`${label}-value-${index}`}
              data-fs-element={`${rest['data-fs-element']}-value-${index}`}
              type="text"
              placeholder="value"
              disabled={disabled}
            />
          </Field>
          <IconButton
            name="minus-circle"
            type="button"
            data-fs-element={`${rest['data-fs-element']}-delete-${index}`}
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
          data-fs-element={`${rest['data-fs-element']}-add`}
          className={styles.addButton}
        >
          <Icon name="plus" />
          &nbsp; Add {label.toLocaleLowerCase()}
        </Button>
      )}
    </VerticalGroup>
  );
};
