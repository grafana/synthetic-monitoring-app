import React, { useCallback, useMemo, useRef } from 'react';
import { Controller, FieldErrorsImpl, useFieldArray, useFormContext, useFormState } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Field, Icon, IconButton, Input, Select, Tag, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { get } from 'lodash';

import { CheckFormValues, Probe } from 'types';
import { interpolateErrorMessage } from 'components/CheckForm/utils';

import { useCheckLabels } from '../../hooks/useCheckLabels';

export type NameValueName = 'settings.http.headers' | 'settings.http.proxyConnectHeaders' | 'labels';

interface Props {
  name: NameValueName;
  limit?: number;
  disabled?: boolean;
  label: string;
  'data-fs-element'?: string;
}

function getErrors(errors: FieldErrorsImpl<CheckFormValues | Probe>, name: NameValueName) {
  return get(errors, name);
}

export const NameValueInput = ({ name, disabled, limit, label, ...rest }: Props) => {
  const {
    register,
    control,
    formState: { errors },
    trigger,
  } = useFormContext<CheckFormValues | Probe>();
  const { isSubmitted } = useFormState({ control });
  const addRef = useRef<HTMLButtonElement>(null);
  const { fields, append, remove } = useFieldArray({ control, name });
  const styles = useStyles2(getStyles);
  const checkLabels = useCheckLabels();
  const labelOptions = useMemo(() => {
    return checkLabels.map((label) => ({ label, value: label }));
  }, [checkLabels]);

  const fieldError = getErrors(errors, name);

  const handleTrigger = useCallback(() => {
    if (isSubmitted) {
      trigger(name);
    }
  }, [trigger, isSubmitted, name]);

  return (
    <div className={styles.stackCol}>
      {fields.map((field, index) => {
        const labelValueField = register(`${name}.${index}.value`);

        return (
          <div key={field.id} className={styles.stack}>
            <Controller
              name={`${name}.${index}.name`}
              control={control}
              render={({ field }) => {
                const { ref, ...labelNameField } = field;

                return (
                  <Field
                    invalid={Boolean(fieldError?.[index]?.name?.type)}
                    error={interpolateErrorMessage(fieldError?.[index]?.name?.message, label)}
                    className={styles.field}
                    required
                  >
                    <Select
                      prefix={<Icon name="arrow-down" />}
                      icon="tag-alt"
                      // formatCreateLabel={() => `Create new ${label}`}
                      fullWidth
                      hideSelectedOptions
                      data-testid={`${label}-name-${index}`}
                      allowCustomValue
                      autoFocus={!field.value}
                      aria-label={`${label} ${index + 1} name`}
                      disabled={disabled}
                      options={labelOptions}
                      // tabSelectsValue={false}
                      {...labelNameField}
                      onChange={(v) => {
                        labelNameField.onChange(v.value);
                        handleTrigger();
                      }}
                      formatOptionLabel={(item, meta) => {
                        console.log('item', item, 'meta', meta);
                        if (meta.context === 'menu' && typeof item.label === 'string') {
                          return <Tag name={item.label as string} />;
                        }
                        return <div>{item.label}</div>;
                      }}
                      placeholder="name"
                    />
                  </Field>
                );
              }}
            ></Controller>
            <Field
              invalid={Boolean(fieldError?.[index]?.value)}
              error={interpolateErrorMessage(fieldError?.[index]?.value?.message, label)}
              className={styles.field}
              required
            >
              <Input
                {...labelValueField}
                aria-label={`${label} ${index + 1} value`}
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
            <div className={styles.remove}>
              <IconButton
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
            </div>
          </div>
        );
      })}
      {(limit === undefined || fields.length < limit) && (
        <div className={styles.stack}>
          <Button
            onClick={() => append({ name: '', value: '' }, { shouldFocus: false })}
            disabled={disabled}
            variant="secondary"
            size="sm"
            type="button"
            ref={addRef}
            data-fs-element={`${rest['data-fs-element']}-add`}
            className={styles.addButton}
            icon={`plus`}
          >
            Add {label.toLocaleLowerCase()}
          </Button>
        </div>
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  addButton: css({ marginTop: theme.spacing(1) }),
  field: css({ marginBottom: 0, marginTop: 0, width: '100%' }),

  stack: css({
    display: `flex`,
    gap: theme.spacing(1),
  }),
  stackCol: css({
    display: 'flex',
    gap: theme.spacing(1),
    flexDirection: 'column',
    marginTop: theme.spacing(1),
  }),
  remove: css({
    marginTop: theme.spacing(1),
  }),
});
