import React from 'react';
import { Controller, FieldError, useFieldArray, useFormContext } from 'react-hook-form';
import { Button, Field, Icon, IconButton, Input, Select, useStyles2 } from '@grafana/ui';
import { cx } from '@emotion/css';

import { MultiHttpAssertionType } from 'types';
import {
  ASSERTION_CONDITION_OPTIONS,
  ASSERTION_SUBJECT_OPTIONS,
  MULTI_HTTP_ASSERTION_TYPE_OPTIONS,
} from 'components/constants';

import { getMultiHttpTabStyles, MultiHttpTabProps } from './Tabs';

export function AssertionsTab({ index, active }: MultiHttpTabProps) {
  const assertionFieldName = `settings.multihttp.entries[${index}].checks`;
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: assertionFieldName,
  });
  const styles = useStyles2(getMultiHttpTabStyles);
  const { formState } = useFormContext();

  return (
    <div className={cx(styles.inputsContainer, { [styles.inactive]: !active })}>
      <Field
        label="Assertions"
        description="Use assertions to validate that the system is responding with the expected content"
      >
        <>
          {fields.map((field, assertionIndex) => {
            const assertionTypeName = `${assertionFieldName}[${assertionIndex}].type` ?? '';
            const errorPath = formState.errors.settings?.multihttp?.entries?.[index]?.checks?.[assertionIndex];

            return (
              <div className={styles.fieldsContainer} key={field.id} id="chris">
                <Controller
                  name={assertionTypeName}
                  render={({ field: typeField }) => {
                    return (
                      <Field
                        label="Assertion type"
                        description="Method for finding assertion value"
                        invalid={errorPath?.type}
                        error={errorPath?.type?.message}
                      >
                        <Select
                          id={`multihttp-assertion-type-${index}-${assertionIndex}`}
                          data-testid={`multihttp-assertion-type-${index}-${assertionIndex}`}
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
                <AssertionFields fieldName={`${assertionFieldName}[${assertionIndex}]`} errors={errorPath} />

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

function AssertionFields({ fieldName, errors }: { fieldName: string; errors: any }) {
  const { watch } = useFormContext();
  const assertionType = watch(`${fieldName}.type`);
  switch (assertionType?.value) {
    case MultiHttpAssertionType.Text:
      return (
        <>
          <AssertionSubjectField fieldName={fieldName} error={errors?.subject} />
          <AssertionConditionField fieldName={fieldName} error={errors?.condition} />
          <AssertionValueField fieldName={fieldName} error={errors?.value} />
        </>
      );
    case MultiHttpAssertionType.JSONPathValue:
      return (
        <>
          <AssertionExpressionField fieldName={fieldName} error={errors?.expression} />
          <AssertionConditionField fieldName={fieldName} error={errors?.condition} />
          <AssertionValueField fieldName={fieldName} error={errors?.value} />
        </>
      );
    case MultiHttpAssertionType.JSONPath:
      return (
        <>
          <AssertionExpressionField fieldName={fieldName} error={errors?.expression} />
        </>
      );
    case MultiHttpAssertionType.Regex:
      return (
        <>
          <AssertionSubjectField fieldName={fieldName} error={errors?.subject} />
          <AssertionExpressionField fieldName={fieldName} error={errors?.expression} />
        </>
      );
    default:
      return null;
  }
}

function AssertionSubjectField({ fieldName, error }: { fieldName: string; error?: FieldError }) {
  return (
    <Controller
      name={`${fieldName}.subject`}
      render={({ field }) => {
        return (
          <Field
            label="Subject"
            description="Target value to assert against"
            invalid={Boolean(error)}
            error={error?.message}
          >
            <Select id={`${fieldName}-subject`} {...field} options={ASSERTION_SUBJECT_OPTIONS} menuPlacement="bottom" />
          </Field>
        );
      }}
      rules={{ required: 'Subject is required' }}
    />
  );
}

function AssertionConditionField({ fieldName, error }: { fieldName: string; error?: FieldError }) {
  return (
    <Controller
      name={`${fieldName}.condition`}
      render={({ field }) => {
        return (
          <Field label="Condition" description="Comparator" invalid={Boolean(error)} error={error?.message}>
            <Select
              id={`${fieldName}-condition`}
              {...field}
              options={ASSERTION_CONDITION_OPTIONS}
              menuPlacement="bottom"
            />
          </Field>
        );
      }}
      rules={{ required: 'Condition is required' }}
    />
  );
}

function AssertionValueField({ fieldName, error }: { fieldName: string; error?: FieldError }) {
  const { register, watch } = useFormContext();
  const assertionType = watch(`${fieldName}.type`);
  const description =
    assertionType.value === MultiHttpAssertionType.Text
      ? 'Value to compare with Subject'
      : 'Value to compare with result of expression';
  return (
    <Field label="Value" description={description} invalid={Boolean(error)} error={error?.message}>
      <Input
        placeholder="Value"
        id={`${fieldName}-value`}
        {...register(`${fieldName}.value`, { required: 'Value is required' })}
      />
    </Field>
  );
}

function getExpressionPlaceholderInfo(assertionType: MultiHttpAssertionType) {
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

function AssertionExpressionField({ fieldName, error }: { fieldName: string; error?: FieldError }) {
  const { register, watch } = useFormContext();
  const assertionType = watch(`${fieldName}.type`);
  const { description, placeholder } = getExpressionPlaceholderInfo(assertionType.value);

  return (
    <Field label="Expression" invalid={Boolean(error)} error={error?.message} description={description}>
      <Input
        placeholder={placeholder}
        data-testid={`${fieldName}-expression`}
        id={`${fieldName}-expression`}
        {...register(`${fieldName}.expression`, {
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
