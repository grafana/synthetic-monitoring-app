import React from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { Button, Field, Icon, IconButton, Input, Select, useStyles2 } from '@grafana/ui';
import { cx } from '@emotion/css';

import { CheckFormValuesMultiHttp, MultiHttpAssertionType } from 'types';
import {
  ASSERTION_CONDITION_OPTIONS,
  ASSERTION_SUBJECT_OPTIONS,
  MULTI_HTTP_ASSERTION_TYPE_OPTIONS,
} from 'components/constants';

import { getMultiHttpTabStyles, MultiHttpTabProps } from './Tabs';

export function AssertionsTab({ index, active }: MultiHttpTabProps) {
  const assertionFieldName = `settings.multihttp.entries.${index}.checks` as const;
  const { control, formState } = useFormContext<CheckFormValuesMultiHttp>();
  const { fields, append, remove } = useFieldArray<CheckFormValuesMultiHttp>({
    control,
    name: assertionFieldName,
  });
  const styles = useStyles2(getMultiHttpTabStyles);

  return (
    <div className={cx(styles.inputsContainer, { [styles.inactive]: !active })}>
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
              <div className={styles.fieldsContainer} key={field.id}>
                <Controller<CheckFormValuesMultiHttp>
                  name={assertionTypeName}
                  render={({ field: typeField }) => {
                    const id = `multihttp-assertion-type-${index}-${assertionIndex}`;
                    return (
                      <Field
                        label="Assertion type"
                        description="Method for finding assertion value"
                        invalid={Boolean(error)}
                        error={typeof errMessage === 'string' && errMessage}
                        htmlFor={id}
                      >
                        <Select
                          inputId={id}
                          className={styles.minInputWidth}
                          {...typeField}
                          options={MULTI_HTTP_ASSERTION_TYPE_OPTIONS}
                          menuPlacement="bottom"
                        />
                      </Field>
                    );
                  }}
                  rules={{ required: 'Assertion type is required' }}
                />
                <AssertionFields entryIndex={index} assertionIndex={assertionIndex} />

                <div className={styles.iconContainer}>
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
          append({ type: undefined, expression: '' });
        }}
        variant="secondary"
        size="sm"
        type="button"
        className={styles.addHeaderQueryButton}
      >
        <Icon name="plus" />
        &nbsp; Add assertions
      </Button>
    </div>
  );
}

type AssertionProps = {
  entryIndex: number;
  assertionIndex: number;
};

function AssertionFields(props: AssertionProps) {
  const { entryIndex, assertionIndex } = props;
  const { watch } = useFormContext<CheckFormValuesMultiHttp>();
  const assertionFieldName = `settings.multihttp.entries.${entryIndex}.checks.${assertionIndex}.type` as const;

  const assertionType = watch(assertionFieldName);
  switch (assertionType?.value) {
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
}

function AssertionSubjectField({ entryIndex, assertionIndex }: AssertionProps) {
  const { formState } = useFormContext<CheckFormValuesMultiHttp>();
  const error = formState.errors.settings?.multihttp?.entries?.[entryIndex]?.checks?.[assertionIndex]?.subject;
  const errMessage = error?.message;

  return (
    <Controller<CheckFormValuesMultiHttp>
      name={`settings.multihttp.entries.${entryIndex}.checks.${assertionIndex}.subject`}
      render={({ field }) => {
        const id = `${entryIndex}-${assertionIndex}-subject`;

        return (
          <Field
            label="Subject"
            description="Target value to assert against"
            invalid={Boolean(error)}
            error={typeof errMessage === 'string' && errMessage}
            htmlFor={id}
          >
            <Select inputId={id} {...field} options={ASSERTION_SUBJECT_OPTIONS} menuPlacement="bottom" />
          </Field>
        );
      }}
      rules={{ required: 'Subject is required' }}
    />
  );
}

function AssertionConditionField({ entryIndex, assertionIndex }: AssertionProps) {
  const { formState } = useFormContext<CheckFormValuesMultiHttp>();
  const error = formState.errors.settings?.multihttp?.entries?.[entryIndex]?.checks?.[assertionIndex]?.condition;
  const errMessage = error?.message;

  return (
    <Controller<CheckFormValuesMultiHttp>
      name={`settings.multihttp.entries.${entryIndex}.checks.${assertionIndex}.condition`}
      render={({ field }) => {
        const id = `multihttp-assertion-condition-${entryIndex}-${assertionIndex}`;

        return (
          <Field
            label="Condition"
            description="Comparator"
            invalid={Boolean(error)}
            error={typeof errMessage === 'string' && errMessage}
            htmlFor={id}
          >
            <Select inputId={id} {...field} options={ASSERTION_CONDITION_OPTIONS} menuPlacement="bottom" />
          </Field>
        );
      }}
      rules={{ required: 'Condition is required' }}
    />
  );
}

function AssertionValueField({ entryIndex, assertionIndex }: AssertionProps) {
  const { formState, register, watch } = useFormContext<CheckFormValuesMultiHttp>();
  const error = formState.errors.settings?.multihttp?.entries?.[entryIndex]?.checks?.[assertionIndex]?.value;
  const assertionType = watch(`settings.multihttp.entries.${entryIndex}.checks.${assertionIndex}.type`);
  const description =
    assertionType.value === MultiHttpAssertionType.Text
      ? 'Value to compare with Subject'
      : 'Value to compare with result of expression';

  return (
    <Field label="Value" description={description} invalid={Boolean(error)} error={error?.message as unknown as string}>
      <Input
        placeholder="Value"
        id={`${entryIndex}-${assertionIndex}-value`}
        {...register(`settings.multihttp.entries.${entryIndex}.checks.${assertionIndex}.value`, {
          required: 'Value is required',
        })}
      />
    </Field>
  );
}

function AssertionExpressionField({ entryIndex, assertionIndex }: AssertionProps) {
  const { formState, register, watch } = useFormContext<CheckFormValuesMultiHttp>();
  const assertionType = watch(`settings.multihttp.entries.${entryIndex}.checks.${assertionIndex}.type`);
  const { description, placeholder } = getExpressionPlaceholderInfo(assertionType?.value);
  const error = formState.errors.settings?.multihttp?.entries?.[entryIndex]?.checks?.[assertionIndex]?.expression;

  return (
    <Field label="Expression" invalid={Boolean(error)} error={error?.message} description={description}>
      <Input
        placeholder={placeholder}
        data-testid={`${entryIndex}-${assertionIndex}-expression`}
        id={`${entryIndex}-${assertionIndex}-expression`}
        {...register(`settings.multihttp.entries.${entryIndex}.checks.${assertionIndex}.expression`, {
          required: 'Expression is required',
          validate: (value) => {
            if (!value) {
              return 'Expression is required';
            }
            return;
          },
        })}
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
