import { useStyles2, HorizontalGroup, Select, Button, Icon, Input, Field, IconButton } from '@grafana/ui';
import {
  ASSERTION_CONDITION_OPTIONS,
  ASSERTION_SUBJECT_OPTIONS,
  MULTI_HTTP_ASSERTION_TYPE_OPTIONS,
} from 'components/constants';
import React from 'react';
import { useFormContext, useFieldArray, Controller, FieldError } from 'react-hook-form';
import { MultiHttpAssertionType } from 'types';
import { MultiHttpTabProps, getMultiHttpTabStyles } from './Tabs';
import { cx } from '@emotion/css';

export function AssertionsTab({ index, label, active }: MultiHttpTabProps) {
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
              <HorizontalGroup spacing="md" key={field.id} align="flex-start">
                <Controller
                  name={assertionTypeName}
                  render={({ field: typeField }) => {
                    return (
                      <Field label="Assertion type" invalid={errorPath?.type} error={errorPath?.type?.message}>
                        <Select
                          id={`multihttp-assertion-type-${index}-${assertionIndex}`}
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
                <IconButton
                  className={styles.removeIconWithLabel}
                  name="minus-circle"
                  type="button"
                  onClick={() => {
                    remove(assertionIndex);
                  }}
                />
              </HorizontalGroup>
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
        <HorizontalGroup spacing="sm" align="flex-start">
          <AssertionSubjectField fieldName={fieldName} error={errors?.subject} />
          <AssertionConditionField fieldName={fieldName} error={errors?.condition} />
          <AssertionValueField fieldName={fieldName} error={errors?.value} />
        </HorizontalGroup>
      );
    case MultiHttpAssertionType.JSONPathValue:
      return (
        <HorizontalGroup spacing="sm" align="flex-start">
          <AssertionExpressionField fieldName={fieldName} error={errors?.expression} />
          <AssertionConditionField fieldName={fieldName} error={errors?.condition} />
          <AssertionValueField fieldName={fieldName} error={errors?.value} />
        </HorizontalGroup>
      );
    case MultiHttpAssertionType.JSONPath:
      return (
        <HorizontalGroup spacing="sm" align="flex-start">
          <AssertionExpressionField fieldName={fieldName} error={errors?.expression} />
        </HorizontalGroup>
      );
    case MultiHttpAssertionType.Regex:
      return (
        <HorizontalGroup spacing="sm" align="flex-start">
          <AssertionSubjectField fieldName={fieldName} error={errors?.subject} />
          <AssertionExpressionField fieldName={fieldName} error={errors?.expression} />
        </HorizontalGroup>
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
          <Field label="Subject" invalid={Boolean(error)} error={error?.message}>
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
          <Field label="Condition" invalid={Boolean(error)} error={error?.message}>
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
  const { register } = useFormContext();
  return (
    <Field label="Value" invalid={Boolean(error)} error={error?.message}>
      <Input
        placeholder="Value"
        id={`${fieldName}-value`}
        {...register(`${fieldName}.value`, { required: 'Value is required' })}
      />
    </Field>
  );
}

function AssertionExpressionField({ fieldName, error }: { fieldName: string; error?: FieldError }) {
  const { register } = useFormContext();
  return (
    <Field label="Expression" invalid={Boolean(error)} error={error?.message}>
      <Input
        placeholder="$."
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
