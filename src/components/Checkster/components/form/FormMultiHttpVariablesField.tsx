import React, { ComponentProps } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button, IconButton, Stack, TextLink, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValues, MultiHttpVariableType } from 'types';

import { MULTI_HTTP_VARIABLE_TYPE_OPTIONS } from '../../../constants';
import { FIELD_SPACING } from '../../constants';
import { createPath } from '../../utils/form';
import { GenericInputField } from './generic/GenericInputField';
import { GenericInputSelectField } from './generic/GenericInputSelectField';

interface FormMultiHttpVariablesFieldProps {
  field: `settings.multihttp.entries.${number}.variables`;
}

const expressionFieldPropsMap: Record<
  MultiHttpVariableType,
  Pick<ComponentProps<typeof GenericInputField>, 'label' | 'description' | 'placeholder'>
> = {
  [MultiHttpVariableType.CSS_SELECTOR]: {
    label: 'Selector',
    description: (
      <>
        Selector query (see{' '}
        <TextLink
          variant="bodySmall"
          href="https://grafana.com/docs/k6/latest/javascript-api/k6-html/selection/selection-find/"
          external
        >
          docs
        </TextLink>
        )`
      </>
    ),
    placeholder: 'div p',
  },
  [MultiHttpVariableType.JSON_PATH]: {
    label: 'JSON Path expression',
    description: 'A JSONPath expression specifies a path to an element (or a set of elements) in a JSON structure.',
    placeholder: '$.',
  },
  [MultiHttpVariableType.REGEX]: {
    label: 'Regular expression',
    description: 'Performs regular expression on the response HTML',
    placeholder: 'expression',
  },
};

function getExpressionFieldProps(variableType: MultiHttpVariableType) {
  return expressionFieldPropsMap[variableType];
}

export function FormMultiHttpVariablesField({ field }: FormMultiHttpVariablesFieldProps) {
  const theme = useTheme2();

  const {
    control,
    watch,
    formState: { disabled },
  } = useFormContext<CheckFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: field });
  const hasVariables = fields.length > 0;
  return (
    <Stack direction="column" gap={1}>
      {hasVariables && (
        <Stack direction="column" gap={FIELD_SPACING}>
          {fields.map((fieldArray, index) => {
            const variableType = watch(createPath(field, index, 'type'));
            const isCssSelectorType = variableType === MultiHttpVariableType.CSS_SELECTOR;

            return (
              <div
                key={fieldArray.id}
                className={css`
                  &:not(:last-of-type) {
                    padding-bottom: ${theme.spacing(FIELD_SPACING)};
                    border-bottom: 1px solid ${theme.colors.border.medium};
                  }
                `}
              >
                <Stack direction="column" gap={1}>
                  <Stack gap={1}>
                    <div
                      className={css`
                        flex-grow: 1;
                      `}
                    >
                      <GenericInputField
                        field={createPath(field, index, 'name')}
                        label="Variable name"
                        placeholder="name"
                      />
                    </div>
                    <div
                      className={css`
                        flex-grow: 0;
                      `}
                    >
                      <GenericInputSelectField
                        field={createPath(field, index, 'type')}
                        label="Type"
                        width={21}
                        options={MULTI_HTTP_VARIABLE_TYPE_OPTIONS}
                      />
                    </div>
                    <div
                      className={css`
                        height: ${theme.spacing(theme.components.height.md)}; // height of a normal input
                        align-self: flex-end;
                        display: flex;
                        align-items: center;
                      `}
                    >
                      <IconButton
                        tooltip="Remove variable"
                        aria-label="Remove variable"
                        name="minus"
                        onClick={() => remove(index)}
                      />
                    </div>
                  </Stack>
                  {/* TextLink bodySmall has the "wrong" line-height, hence the alignItems */}
                  <div
                    className={css`
                      display: flex;
                      align-items: flex-end;
                      gap: ${theme.spacing(1)};

                      & > div {
                        flex-basis: 50%;
                      }
                    `}
                  >
                    {isCssSelectorType && (
                      <>
                        <GenericInputField
                          field={createPath(field, index, 'attribute')}
                          label="HTML attribute name"
                          description="Pupulate variable with attribute value. Leave empty for inner HTML."
                          placeholder="aria-label"
                        />
                      </>
                    )}
                    <GenericInputField
                      field={createPath(field, index, 'expression')}
                      {...getExpressionFieldProps(variableType)}
                    />
                  </div>
                </Stack>
              </div>
            );
          })}
        </Stack>
      )}

      <div>
        <Button
          data-fs-element="Variable delete button"
          disabled={disabled}
          icon={`plus`}
          onClick={() => {
            append({ type: MultiHttpVariableType.JSON_PATH, name: '', expression: '' });
          }}
          size="sm"
          type="button"
          variant="secondary"
        >
          Variable
        </Button>
      </div>
    </Stack>
  );
}
