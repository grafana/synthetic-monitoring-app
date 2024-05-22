import React, { useCallback, useRef } from 'react';
import { FieldErrorsImpl, useFieldArray, useFormContext, useFormState } from 'react-hook-form';
import { Button, Field, HorizontalGroup, Icon, IconButton, Input, useTheme2, VerticalGroup } from '@grafana/ui';
import { css } from '@emotion/css';
import { get } from 'lodash';

import { CheckFormValues, Probe } from 'types';
import { parseErrorMessage } from 'components/CheckForm/utils';

export type NameValueName = 'settings.http.headers' | 'settings.http.proxyConnectHeaders' | 'labels';

interface Props {
  ariaLabelSuffix?: string;
  name: NameValueName;
  limit?: number;
  disabled?: boolean;
  label: string;
  'data-fs-element'?: string;
}

function getErrors(errors: FieldErrorsImpl<CheckFormValues | Probe>, name: NameValueName) {
  return get(errors, name);
}

export const NameValueInput = ({ ariaLabelSuffix = ``, name, disabled, limit, label, ...rest }: Props) => {
  const {
    register,
    control,
    formState: { errors },
    trigger,
  } = useFormContext<CheckFormValues | Probe>();
  const { isSubmitted } = useFormState({ control });
  const addRef = useRef<HTMLButtonElement>(null);
  const { fields, append, remove } = useFieldArray({ control, name });
  const theme = useTheme2();
  const fieldError = getErrors(errors, name);

  const handleTrigger = useCallback(() => {
    if (isSubmitted) {
      trigger(name);
    }
  }, [trigger, isSubmitted, name]);

  return (
    <VerticalGroup justify="space-between">
      {fields.map((field, index) => {
        const labelNameField = register(`${name}.${index}.name`);
        const labelValueField = register(`${name}.${index}.value`);
        console.log(fieldError);

        return (
          <HorizontalGroup key={field.id} align="flex-start">
            <Field
              invalid={Boolean(fieldError?.[index]?.name?.type)}
              error={parseErrorMessage(fieldError?.[index]?.name?.message, label)}
              className={css`
                margin-bottom: 0;
              `}
              required
            >
              <Input
                {...labelNameField}
                aria-label={`${label} ${index + 1} name ${ariaLabelSuffix}`}
                data-testid={`${label}-name-${index}`}
                type="text"
                placeholder="name"
                disabled={disabled}
                data-fs-element={`${rest['data-fs-element']}-name-${index}`}
                onChange={(v) => {
                  labelNameField.onChange(v);
                  handleTrigger();
                }}
              />
            </Field>
            <Field
              invalid={Boolean(fieldError?.[index]?.value)}
              error={parseErrorMessage(fieldError?.[index]?.value?.message, label)}
              className={css`
                margin-bottom: 0;
              `}
              required
            >
              <Input
                {...labelValueField}
                aria-label={`${label} ${index + 1} value ${ariaLabelSuffix}`}
                data-testid={`${label}-value-${index}`}
                data-fs-element={`${rest['data-fs-element']}-value-${index}`}
                type="text"
                placeholder="value"
                disabled={disabled}
                onChange={(v) => {
                  labelValueField.onChange(v);
                  handleTrigger();
                }}
              />
            </Field>
            <IconButton
              className={css`
                margin-top: ${theme.spacing(2)};
              `}
              name="minus-circle"
              type="button"
              data-fs-element={`${rest['data-fs-element']}-delete-${index}`}
              onClick={() => {
                remove(index);
                requestAnimationFrame(() => {
                  addRef.current?.focus();
                  handleTrigger();
                });
              }}
              disabled={disabled}
              tooltip="Delete"
            />
          </HorizontalGroup>
        );
      })}
      {(limit === undefined || fields.length < limit) && (
        <Button
          onClick={() => {
            append({ name: '', value: '' });
            handleTrigger();
          }}
          disabled={disabled}
          variant="secondary"
          size="sm"
          type="button"
          ref={addRef}
          data-fs-element={`${rest['data-fs-element']}-add`}
        >
          <Icon name="plus" />
          &nbsp; Add {label.toLocaleLowerCase()}
        </Button>
      )}
    </VerticalGroup>
  );
};
