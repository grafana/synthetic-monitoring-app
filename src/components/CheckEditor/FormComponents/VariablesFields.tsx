import React from 'react';
import { Controller, FieldPath, useFieldArray, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Field, IconButton, Input, Select, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValuesMultiHttp, MultiHttpVariableType } from 'types';
import { useCheckFormContext } from 'components/CheckForm/CheckFormContext/CheckFormContext';
import { MULTI_HTTP_VARIABLE_TYPE_OPTIONS } from 'components/constants';

export const VariablesFields = ({ index }: { index: number }) => {
  const styles = useStyles2(getStyles);
  const { isFormDisabled } = useCheckFormContext();
  const variableFieldName: FieldPath<CheckFormValuesMultiHttp> = `settings.multihttp.entries.${index}.variables`;
  const { control, formState, register, watch } = useFormContext<CheckFormValuesMultiHttp>();
  const { append, fields, remove } = useFieldArray<CheckFormValuesMultiHttp>({ control, name: variableFieldName });

  return (
    <Stack direction={`column`}>
      {fields.map((field, variableIndex) => {
        const variableTypeName = `${variableFieldName}.${variableIndex}.type` as const;
        const variableTypeValue = watch(variableTypeName);
        const errorPath = formState.errors.settings?.multihttp?.entries?.[index]?.variables?.[variableIndex];
        // @ts-expect-error -- I think type is a reserved keyword in react-hook-form so it can't read this properly
        const errMessage = errorPath?.type?.message;
        const variableNameId = `multihttp-variable-name-${index}-${variableIndex}`;
        const variableAttributeId = `multihttp-variable-attribute-${index}-${variableIndex}`;
        const variableExpressionId = `multihttp-variable-expression-${index}-${variableIndex}`;

        return (
          <Stack key={field.id}>
            <Field
              label="Variable name"
              description="The name of the variable"
              invalid={Boolean(errorPath?.name)}
              error={errorPath?.name?.message}
              htmlFor={variableNameId}
            >
              <Input
                placeholder="Variable name"
                id={variableNameId}
                invalid={Boolean(
                  formState.errors.settings?.multihttp?.entries?.[index]?.variables?.[variableIndex]?.type
                )}
                data-fs-element="Variable name input"
                disabled={isFormDisabled}
                {...register(`${variableFieldName}.${variableIndex}.name`)}
              />
            </Field>
            <Controller
              name={variableTypeName}
              render={({ field: typeField }) => {
                const { ref, onChange, ...rest } = typeField;
                return (
                  <Field
                    label="Variable type"
                    description="The method of getting a value"
                    invalid={Boolean(errorPath?.type)}
                    error={errMessage}
                    data-fs-element="Variable type select"
                  >
                    <Select
                      aria-label="Variable type"
                      {...rest}
                      disabled={isFormDisabled}
                      options={MULTI_HTTP_VARIABLE_TYPE_OPTIONS}
                      menuPlacement="bottom"
                      onChange={({ value }) => {
                        onChange(value);
                      }}
                    />
                  </Field>
                );
              }}
            />
            {variableTypeValue === MultiHttpVariableType.CSS_SELECTOR && (
              <Field
                label="Attribute"
                description="Name of the attribute to extract the value from. Leave blank to get contents of tag"
                invalid={Boolean(errorPath?.attribute)}
                error={errorPath?.attribute?.message}
                htmlFor={variableAttributeId}
              >
                <Input
                  placeholder="Attribute"
                  id={variableAttributeId}
                  data-fs-element="Variable attribute input"
                  disabled={isFormDisabled}
                  {...register(`${variableFieldName}.${variableIndex}.attribute`)}
                />
              </Field>
            )}
            <Field
              label="Variable expression"
              description="Expression to extract the value"
              error={errorPath?.expression?.message}
              invalid={Boolean(errorPath?.expression)}
              htmlFor={variableExpressionId}
            >
              <div className={styles.aligner}>
                <Input
                  placeholder="Variable expression"
                  id={variableExpressionId}
                  data-fs-element="Variable expression input"
                  disabled={isFormDisabled}
                  invalid={Boolean(errorPath?.expression)}
                  {...register(`${variableFieldName}.${variableIndex}.expression`)}
                />
                <IconButton
                  className={styles.removebutton}
                  name="minus-circle"
                  onClick={() => remove(variableIndex)}
                  tooltip="Delete"
                  data-fs-element="Variable delete button"
                />
              </div>
            </Field>
            <div className={styles.spacer} />
          </Stack>
        );
      })}
      <div>
        <Button
          onClick={() => {
            append({ type: MultiHttpVariableType.JSON_PATH, name: '', expression: '' });
          }}
          disabled={isFormDisabled}
          variant="secondary"
          size="sm"
          type="button"
          data-fs-element="Variable delete button"
          icon={`plus`}
        >
          Add variable
        </Button>
      </div>
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    aligner: css({
      position: 'relative',
    }),
    removebutton: css({
      position: `absolute`,
      left: `calc(100% + 16px)`,
      top: `50%`,
      transform: `translateY(-50%)`,
    }),
    spacer: css({
      width: theme.spacing(2),
    }),
  };
};