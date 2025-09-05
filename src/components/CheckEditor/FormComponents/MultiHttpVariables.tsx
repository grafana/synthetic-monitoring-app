import React from 'react';
import { Controller, FieldPath, useFieldArray, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Field, IconButton, Input, Select, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValuesMultiHttp, MultiHttpVariableType } from 'types';
import { MULTI_HTTP_VARIABLE_TYPE_OPTIONS } from 'components/constants';

export const MultiHttpVariables = ({ index }: { index: number }) => {
  const styles = useStyles2(getStyles);
  const variableFieldName: FieldPath<CheckFormValuesMultiHttp> = `settings.multihttp.entries.${index}.variables`;
  const { control, formState, register, watch } = useFormContext<CheckFormValuesMultiHttp>();
  const { append, fields, remove } = useFieldArray<CheckFormValuesMultiHttp>({ control, name: variableFieldName });
  const isFormDisabled = formState.disabled;

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
              description="The name of the variable"
              error={errorPath?.name?.message}
              htmlFor={variableNameId}
              invalid={Boolean(errorPath?.name)}
              label="Variable name"
            >
              <Input
                {...register(`${variableFieldName}.${variableIndex}.name`)}
                data-fs-element="Variable name input"
                disabled={isFormDisabled}
                id={variableNameId}
                invalid={Boolean(
                  formState.errors.settings?.multihttp?.entries?.[index]?.variables?.[variableIndex]?.type
                )}
                placeholder="Variable name"
              />
            </Field>
            <Controller
              name={variableTypeName}
              render={({ field: typeField }) => {
                const { ref, onChange, ...rest } = typeField;
                return (
                  <Field
                    data-fs-element="Variable type select"
                    description="The method of getting a value"
                    error={errMessage}
                    invalid={Boolean(errorPath?.type)}
                    label="Variable type"
                  >
                      <Select  // eslint-disable-line @typescript-eslint/no-deprecated
                      {...rest}
                      aria-label="Variable type"
                      disabled={isFormDisabled}
                      menuPlacement="bottom"
                      onChange={({ value }) => {
                        onChange(value);
                      }}
                      options={MULTI_HTTP_VARIABLE_TYPE_OPTIONS}
                    />
                  </Field>
                );
              }}
            />
            {variableTypeValue === MultiHttpVariableType.CSS_SELECTOR && (
              <Field
                description="Name of the attribute to extract the value from. Leave blank to get contents of tag"
                error={errorPath?.attribute?.message}
                htmlFor={variableAttributeId}
                invalid={Boolean(errorPath?.attribute)}
                label="Attribute"
              >
                <Input
                  {...register(`${variableFieldName}.${variableIndex}.attribute`)}
                  data-fs-element="Variable attribute input"
                  disabled={isFormDisabled}
                  id={variableAttributeId}
                  placeholder="Attribute"
                />
              </Field>
            )}
            <Field
              description="Expression to extract the value"
              error={errorPath?.expression?.message}
              htmlFor={variableExpressionId}
              invalid={Boolean(errorPath?.expression)}
              label="Variable expression"
            >
              <div className={styles.aligner}>
                <Input
                  {...register(`${variableFieldName}.${variableIndex}.expression`)}
                  data-fs-element="Variable expression input"
                  disabled={isFormDisabled}
                  id={variableExpressionId}
                  invalid={Boolean(errorPath?.expression)}
                  placeholder="Variable expression"
                />
                <IconButton
                  className={styles.removebutton}
                  data-fs-element="Variable delete button"
                  name="minus-circle"
                  onClick={() => remove(variableIndex)}
                  tooltip="Delete"
                />
              </div>
            </Field>
            <div className={styles.spacer} />
          </Stack>
        );
      })}
      <div>
        <Button
          data-fs-element="Variable delete button"
          disabled={isFormDisabled}
          icon={`plus`}
          onClick={() => {
            append({ type: MultiHttpVariableType.JSON_PATH, name: '', expression: '' });
          }}
          size="sm"
          type="button"
          variant="secondary"
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
