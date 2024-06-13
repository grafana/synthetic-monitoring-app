import React, { useState } from 'react';
import {
  Controller,
  FieldError,
  FieldErrorsImpl,
  FieldPath,
  Merge,
  useFieldArray,
  useFormContext,
} from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Field, IconButton, Input, Select, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValuesMultiHttp, MultiHttpAssertionType } from 'types';
import {
  ASSERTION_CONDITION_OPTIONS,
  ASSERTION_SUBJECT_OPTIONS,
  MULTI_HTTP_ASSERTION_TYPE_OPTIONS,
} from 'components/constants';
import { MultiHttpCollapse } from 'components/MultiHttp/MultiHttpCollapse';
import {
  Assertion,
  AssertionConditionVariant,
  AssertionJsonPath,
  AssertionJsonPathValue,
  AssertionRegex,
  AssertionSubjectVariant,
  AssertionText,
} from 'components/MultiHttp/MultiHttpTypes';

export const MultiHttpAssertions = () => {
  const { getValues } = useFormContext<CheckFormValuesMultiHttp>();
  const values = getValues();
  const entries = values.settings?.multihttp?.entries ?? [];
  const [toggleStates, setToggleStates] = useState<boolean[]>(entries.map(() => true));
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      {entries.map((entry, index) => {
        return (
          <MultiHttpCollapse
            key={`${entry.request.method}-${entry.request.url}`}
            label={entry.request.url || `Request ${index + 1}`}
            isOpen={toggleStates[index]}
            onToggle={() => {
              setToggleStates((prev) => {
                const newStates = [...prev];
                newStates[index] = !newStates[index];
                return newStates;
              });
            }}
            requestMethod={entry.request.method}
          >
            <RequestAssertions index={index} />
          </MultiHttpCollapse>
        );
      })}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    marginBottom: theme.spacing(4),
  }),
});

const RequestAssertions = ({ index }: { index: number }) => {
  const assertionFieldName: FieldPath<CheckFormValuesMultiHttp> = `settings.multihttp.entries.${index}.checks`;
  const { control, formState } = useFormContext<CheckFormValuesMultiHttp>();
  const { fields, append, remove } = useFieldArray<CheckFormValuesMultiHttp>({
    control,
    name: assertionFieldName,
  });

  return (
    <>
      <Field
        label="Assertions"
        description="Use assertions to validate that the system is responding with the expected content"
      >
        <>
          {fields.map((field, assertionIndex) => {
            const assertionTypeName = `${assertionFieldName}.${assertionIndex}.type` as const;
            const error = formState.errors.settings?.multihttp?.entries?.[index]?.checks?.[assertionIndex]?.type;
            // @ts-expect-error - I think 'type' is a reservered keyword in react-hook-form so it can't read this properly
            const errMessage = error?.message;

            return (
              <div key={field.id} className={styles.container}>
                <Controller
                  name={assertionTypeName}
                  render={({ field }) => {
                    const id = `multihttp-assertion-type-${index}-${assertionIndex}`;
                    const { ref, onChange, ...rest } = field;

                    return (
                      <Field
                        label="Assertion type"
                        description="Method for finding assertion value"
                        invalid={Boolean(error)}
                        error={typeof errMessage === 'string' && errMessage}
                        htmlFor={id}
                        data-fs-element="Assertion type select"
                      >
                        <Select
                          inputId={id}
                          {...rest}
                          options={MULTI_HTTP_ASSERTION_TYPE_OPTIONS}
                          menuPlacement="bottom"
                          onChange={(e) => {
                            field.onChange(e.value);
                          }}
                        />
                      </Field>
                    );
                  }}
                />
                <AssertionFields entryIndex={index} assertionIndex={assertionIndex} />

                <div>
                  <IconButton
                    name="minus-circle"
                    onClick={() => {
                      remove(assertionIndex);
                    }}
                    tooltip="Delete"
                  />
                </div>
              </div>
            );
          })}
        </>
      </Field>
      <Button
        onClick={() => {
          append({
            type: MultiHttpAssertionType.Text,
            condition: AssertionConditionVariant.Contains,
            subject: AssertionSubjectVariant.ResponseBody,
            value: ``,
          });
        }}
        variant="secondary"
        size="sm"
        type="button"
        icon="plus"
      >
        Add assertions
      </Button>
    </>
  );
};

type AssertionProps = {
  entryIndex: number;
  assertionIndex: number;
};

const AssertionFields = (props: AssertionProps) => {
  const { entryIndex, assertionIndex } = props;
  const { watch } = useFormContext<CheckFormValuesMultiHttp>();
  const assertionFieldName = `settings.multihttp.entries.${entryIndex}.checks.${assertionIndex}.type` as const;

  const assertionType = watch(assertionFieldName);
  switch (assertionType) {
    case MultiHttpAssertionType.Text:
      return (
        <>
          <AssertionSubjectField {...props} />
          <AssertionConditionField {...props} />
          <AssertionValueField {...props} />
        </>
      );
    case MultiHttpAssertionType.JSONPathValue:
      return (
        <>
          <AssertionExpressionField {...props} />
          <AssertionConditionField {...props} />
          <AssertionValueField {...props} />
        </>
      );
    case MultiHttpAssertionType.JSONPath:
      return (
        <>
          <AssertionExpressionField {...props} />
        </>
      );
    case MultiHttpAssertionType.Regex:
      return (
        <>
          <AssertionSubjectField {...props} />
          <AssertionExpressionField {...props} />
        </>
      );
    default:
      return null;
  }
};

function AssertionSubjectField({ entryIndex, assertionIndex }: AssertionProps) {
  const { formState } = useFormContext<CheckFormValuesMultiHttp>();
  const error = formState.errors.settings?.multihttp?.entries?.[entryIndex]?.checks?.[assertionIndex];
  const errorSubject = errorHasSubject(error) ? error?.subject : undefined;
  const errorMessage = errorSubject?.message;

  return (
    <Controller
      name={`settings.multihttp.entries.${entryIndex}.checks.${assertionIndex}.subject`}
      render={({ field }) => {
        const id = `${entryIndex}-${assertionIndex}-subject`;
        const { ref, onChange, ...rest } = field;

        return (
          <Field
            label="Subject"
            description="Target value to assert against"
            invalid={Boolean(errorSubject)}
            error={errorMessage}
            htmlFor={id}
            data-fs-element="Assertion subject select"
          >
            <Select
              inputId={id}
              {...rest}
              options={ASSERTION_SUBJECT_OPTIONS}
              menuPlacement="bottom"
              onChange={(e) => field.onChange(e.value)}
            />
          </Field>
        );
      }}
    />
  );
}

function AssertionConditionField({ entryIndex, assertionIndex }: AssertionProps) {
  const { formState } = useFormContext<CheckFormValuesMultiHttp>();
  const error = formState.errors.settings?.multihttp?.entries?.[entryIndex]?.checks?.[assertionIndex];
  const errorCondition = errorHasCondition(error) ? error?.condition : undefined;
  const errorMessage = errorCondition?.message;

  return (
    <Controller
      name={`settings.multihttp.entries.${entryIndex}.checks.${assertionIndex}.condition`}
      render={({ field }) => {
        const id = `multihttp-assertion-condition-${entryIndex}-${assertionIndex}`;
        const { ref, onChange, ...rest } = field;

        return (
          <Field
            label="Condition"
            description="Comparator"
            invalid={Boolean(errorCondition)}
            error={errorMessage}
            htmlFor={id}
            data-fs-element="Assertion condition select"
          >
            <Select
              inputId={id}
              {...rest}
              options={ASSERTION_CONDITION_OPTIONS}
              menuPlacement="bottom"
              onChange={(e) => field.onChange(e.value)}
            />
          </Field>
        );
      }}
    />
  );
}

function AssertionValueField({ entryIndex, assertionIndex }: AssertionProps) {
  const { formState, register, watch } = useFormContext<CheckFormValuesMultiHttp>();
  const error = formState.errors.settings?.multihttp?.entries?.[entryIndex]?.checks?.[assertionIndex];
  const errorValue = errorHasValue(error) ? error?.value : undefined;
  const errorMessage = errorValue?.message;
  const assertionType = watch(`settings.multihttp.entries.${entryIndex}.checks.${assertionIndex}.type`);
  const description =
    assertionType === MultiHttpAssertionType.Text
      ? 'Value to compare with Subject'
      : 'Value to compare with result of expression';

  return (
    <Field label="Value" description={description} invalid={Boolean(errorValue)} error={errorMessage}>
      <Input
        placeholder="Value"
        id={`${entryIndex}-${assertionIndex}-value`}
        data-fs-element="Assertion value input"
        {...register(`settings.multihttp.entries.${entryIndex}.checks.${assertionIndex}.value`)}
      />
    </Field>
  );
}

function AssertionExpressionField({ entryIndex, assertionIndex }: AssertionProps) {
  const { formState, register, watch } = useFormContext<CheckFormValuesMultiHttp>();
  const assertionType = watch(`settings.multihttp.entries.${entryIndex}.checks.${assertionIndex}.type`);
  const { description, placeholder } = getExpressionPlaceholderInfo(assertionType);
  const error = formState.errors.settings?.multihttp?.entries?.[entryIndex]?.checks?.[assertionIndex];
  const errorExpression = errorHasExpression(error) ? error?.expression : undefined;
  const errorMessage = errorExpression?.message;

  return (
    <Field label="Expression" invalid={Boolean(errorMessage)} error={errorMessage} description={description}>
      <Input
        placeholder={placeholder}
        data-testid={`${entryIndex}-${assertionIndex}-expression`}
        id={`${entryIndex}-${assertionIndex}-expression`}
        data-fs-element="Assertion expression input"
        {...register(`settings.multihttp.entries.${entryIndex}.checks.${assertionIndex}.expression`)}
      />
    </Field>
  );
}

function getExpressionPlaceholderInfo(assertionType?: MultiHttpAssertionType) {
  switch (assertionType) {
    case MultiHttpAssertionType.JSONPathValue:
    case MultiHttpAssertionType.JSONPath: {
      return {
        placeholder: 'Path lookup using GJSON syntax',
        description: (
          <a
            href="https://github.com/tidwall/gjson#path-syntax"
            style={{ textDecoration: 'underline' }}
            target="_blank"
            rel="noreferrer noopener"
          >
            See here for selector syntax
          </a>
        ),
      };
    }
    case MultiHttpAssertionType.Regex:
      return {
        placeholder: '.*',
        description: 'Regex string without leading or trailing slashes',
      };
    case MultiHttpAssertionType.Text:
    default: {
      return {
        placeholder: '',
        description: <span />,
      };
    }
  }
}

function errorHasSubject(
  error: Merge<FieldError, FieldErrorsImpl<NonNullable<Assertion>>> | undefined
): error is FieldErrorsImpl<AssertionText | AssertionRegex> {
  if (error) {
    return 'subject' in error;
  }

  return false;
}

function errorHasCondition(
  error: Merge<FieldError, FieldErrorsImpl<NonNullable<Assertion>>> | undefined
): error is FieldErrorsImpl<AssertionText | AssertionJsonPathValue> {
  if (error) {
    return 'condition' in error;
  }

  return false;
}

function errorHasValue(
  error: Merge<FieldError, FieldErrorsImpl<NonNullable<Assertion>>> | undefined
): error is FieldErrorsImpl<AssertionText | AssertionJsonPathValue> {
  if (error) {
    return 'value' in error;
  }

  return false;
}

function errorHasExpression(
  error: Merge<FieldError, FieldErrorsImpl<NonNullable<Assertion>>> | undefined
): error is FieldErrorsImpl<AssertionJsonPathValue | AssertionJsonPath | AssertionRegex> {
  if (error) {
    return 'expression' in error;
  }

  return false;
}
