import { useStyles2, HorizontalGroup, Select, Button, Icon, Input, Field, IconButton } from '@grafana/ui';
import {
  ASSERTION_CONDITION_OPTIONS,
  ASSERTION_SUBJECT_OPTIONS,
  MULTI_HTTP_ASSERTION_TYPE_OPTIONS,
} from 'components/constants';
import React from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { MultiHttpAssertionType } from 'types';
import { MultiHttpTabProps, getMultiHttpTabStyles } from './Tabs';

export function AssertionsTab({ index, label }: MultiHttpTabProps) {
  const assertionFieldName = `settings.multihttp.entries[${index}].checks`;
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: assertionFieldName,
  });
  const styles = useStyles2(getMultiHttpTabStyles);
  const { formState } = useFormContext();

  return (
    <div className={styles.inputsContainer}>
      {fields.map((field, assertionIndex) => {
        const assertionTypeName = `${assertionFieldName}[${assertionIndex}].type` ?? '';
        const errorPath = formState.errors.settings?.multihttp?.entries[index]?.checks[assertionIndex];
        return (
          <HorizontalGroup spacing="md" key={field.id}>
            <Controller
              name={assertionTypeName}
              render={({ field: typeField }) => {
                return (
                  <Field label="Assertion type" invalid={errorPath?.type}>
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
              rules={{ required: true }}
            />
            <AssertionFields fieldName={`${assertionFieldName}[${assertionIndex}]`} />
            <IconButton
              className={styles.removeIcon}
              name="minus-circle"
              type="button"
              onClick={() => {
                remove(assertionIndex);
              }}
            />
          </HorizontalGroup>
        );
      })}
      <Button
        onClick={() => {
          append({ type: undefined, expression: '$.' });
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

function AssertionFields({ fieldName }: { fieldName: string }) {
  const { watch } = useFormContext();
  const assertionType = watch(`${fieldName}.type`);
  switch (assertionType?.value) {
    case MultiHttpAssertionType.Text:
      return (
        <HorizontalGroup spacing="sm">
          <AssertionSubjectField fieldName={fieldName} />
          <AssertionConditionField fieldName={fieldName} />
          <AssertionValueField fieldName={fieldName} />
        </HorizontalGroup>
      );
    case MultiHttpAssertionType.JSONPathValue:
      return (
        <HorizontalGroup spacing="sm">
          <AssertionExpressionField fieldName={fieldName} />
          <AssertionConditionField fieldName={fieldName} />
          <AssertionValueField fieldName={fieldName} />
        </HorizontalGroup>
      );
    case MultiHttpAssertionType.JSONPath:
      return (
        <HorizontalGroup spacing="sm">
          <AssertionExpressionField fieldName={fieldName} />
        </HorizontalGroup>
      );
    case MultiHttpAssertionType.Regex:
      return (
        <HorizontalGroup spacing="sm">
          <AssertionSubjectField fieldName={fieldName} />
          <AssertionExpressionField fieldName={fieldName} />
        </HorizontalGroup>
      );
    default:
      return null;
  }
}

function AssertionSubjectField({ fieldName }: { fieldName: string }) {
  return (
    <Controller
      name={`${fieldName}.subject`}
      render={({ field }) => {
        return (
          <Field label="Subject">
            <Select
              id={`${fieldName}-subject}`}
              {...field}
              options={ASSERTION_SUBJECT_OPTIONS}
              menuPlacement="bottom"
            />
          </Field>
        );
      }}
      rules={{ required: true }}
    />
  );
}

function AssertionConditionField({ fieldName }: { fieldName: string }) {
  return (
    <Controller
      name={`${fieldName}.condition`}
      render={({ field }) => {
        return (
          <Field label="Condition">
            <Select
              id={`${fieldName}-condition}`}
              {...field}
              options={ASSERTION_CONDITION_OPTIONS}
              menuPlacement="bottom"
            />
          </Field>
        );
      }}
      rules={{ required: true }}
    />
  );
}

function AssertionValueField({ fieldName }: { fieldName: string }) {
  const { register } = useFormContext();
  return (
    <Field label="Value">
      <Input placeholder="Value" id={`${fieldName}-value`} {...register(`${fieldName}.value`)} />
    </Field>
  );
}

function AssertionExpressionField({ fieldName }: { fieldName: string }) {
  const { register } = useFormContext();
  return (
    <Field label="Expression">
      <Input placeholder="$." id={`${fieldName}-expression`} {...register(`${fieldName}.expression`)} />
    </Field>
  );
}
