import React, { ReactNode, useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, IconButton, Input, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValues } from 'types';

import { getFieldErrorProps } from '../../../utils/form';
import { StyledField } from '../../ui/StyledField';

// Union of known field paths that contain arrays of name/value objects
type NameValueFieldPath = 'labels' | 'settings.http.headers' | 'settings.http.proxyConnectHeaders';

interface GenericNameValueFieldProps {
  label?: string;
  description?: string;
  field: NameValueFieldPath;
  allowEmpty?: true; // Leave undefined to disallow empty key/value pairs
  addButtonText?: string;
  required?: true;
  interpolationVariables?: Record<string, string>;
  namePrefix?: ReactNode;
  namePlaceholder?: string;
  valuePlaceholder?: string;
  limit?: number;
}

export function GenericNameValueField({
  field: fieldName,
  allowEmpty,
  label,
  description,
  required,
  addButtonText = 'Row', // There is + in front of the text, so no need to repeat it here
  interpolationVariables,
  namePrefix,
  limit,
  namePlaceholder = 'Name',
  valuePlaceholder = 'Value',
}: GenericNameValueFieldProps) {
  const {
    register,
    setFocus,
    formState: { errors, disabled },
  } = useFormContext<CheckFormValues>();
  const { fields, append, remove } = useFieldArray({ name: fieldName });
  const styles = useStyles2(getStyles);

  // State for the unregistered row
  const [unregisteredRow, setUnregisteredRow] = useState({ name: '', value: '' });

  // Handle changes in the unregistered row and register it when user starts typing
  const handleUnregisteredChange = (field: 'name' | 'value', value: string) => {
    const newRow = { ...unregisteredRow, [field]: value };
    setUnregisteredRow(newRow);

    // If the user starts typing in either field, register the row with the form
    if (value.length > 0) {
      const nextFieldIndex = fields.length;

      append({ name: newRow.name ?? '', value: newRow.value ?? '' });

      requestAnimationFrame(() => {
        setFocus(`${fieldName}.${nextFieldIndex}.${field}`); // Focus the appropriate field
      });

      setUnregisteredRow({ name: '', value: '' });
    }
  };

  const limitReached = limit !== undefined && fields.length >= limit;

  return (
    <StyledField
      label={label}
      description={description}
      {...getFieldErrorProps(errors, fieldName, interpolationVariables)}
      required={required}
    >
      <Stack direction="column" gap={0.5}>
        {fields.map((field, index) => (
          <Stack key={field.id} alignItems="start">
            <StyledField
              className={styles.field}
              {...getFieldErrorProps(errors, [fieldName, index, 'name'], interpolationVariables)}
            >
              <Input
                prefix={namePrefix}
                {...register(`${fieldName}.${index}.name`)}
                placeholder={namePlaceholder}
                disabled={disabled}
              />
            </StyledField>
            <StyledField
              className={styles.field}
              {...getFieldErrorProps(errors, [fieldName, index, 'value'], interpolationVariables)}
            >
              <Input {...register(`${fieldName}.${index}.value`)} placeholder={valuePlaceholder} disabled={disabled} />
            </StyledField>
            <IconButton
              style={{ marginTop: '8px' }}
              aria-label="Remove row"
              name="minus"
              onClick={() => remove(index)}
              tooltip="Remove"
            />
          </Stack>
        ))}

        {allowEmpty && !limitReached && (
          <Stack alignItems="start">
            <StyledField className={styles.field}>
              <Input
                prefix={namePrefix}
                value={unregisteredRow.name}
                onChange={(e) => handleUnregisteredChange('name', e.currentTarget.value)}
                placeholder={namePlaceholder}
                disabled={disabled}
              />
            </StyledField>
            <StyledField className={styles.field}>
              <Input
                value={unregisteredRow.value}
                onChange={(e) => handleUnregisteredChange('value', e.currentTarget.value)}
                placeholder={valuePlaceholder}
                disabled={disabled}
              />
            </StyledField>
            <IconButton
              style={{ marginTop: '8px', visibility: 'hidden' }}
              disabled
              aria-label="Remove row"
              name="minus"
            />
          </Stack>
        )}

        <div>
          <Button
            icon="plus"
            onClick={() => append({ name: '', value: '' })}
            variant="secondary"
            size="sm"
            type="button"
            disabled={disabled || limitReached}
          >
            {addButtonText}
          </Button>
        </div>
      </Stack>
    </StyledField>
  );
}

function getStyles(_theme: GrafanaTheme2) {
  return {
    row: css`
      display: flex;
    `,
    field: css`
      flex-grow: 1;
    `,
  };
}
