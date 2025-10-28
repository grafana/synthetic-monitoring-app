import React, { Fragment, useMemo } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button, ComboboxOption, IconButton, Stack, Text, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValues, MultiHttpAssertionType } from 'types';
import {
  ASSERTION_CONDITION_OPTIONS,
  ASSERTION_SUBJECT_OPTIONS,
  MULTI_HTTP_ASSERTION_TYPE_OPTIONS,
} from 'components/constants';
import { Assertion, AssertionConditionVariant, AssertionSubjectVariant } from 'components/MultiHttp/MultiHttpTypes';

import { FIELD_SPACING } from '../../constants';
import { useRelevantErrors } from '../../hooks/useRelevantErrors';
import { createPath } from '../../utils/form';
import { getHasSectionError } from '../../utils/navigation';
import { CollapsibleRequestEntry } from '../CollapsibleRequestEntry';
import { GenericInputField } from './generic/GenericInputField';
import { GenericInputSelectField } from './generic/GenericInputSelectField';

interface FormMultiHttpAssertionsFieldProps {
  field: 'settings.multihttp.entries';
}

export const MULTI_HTTP_UPTIME_FIELDS = [/\.entries\.\d+\.checks\.\d+/];

export function FormMultiHttpAssertionsField({ field }: FormMultiHttpAssertionsFieldProps) {
  const { watch, setValue } = useFormContext<CheckFormValues>();
  const { getValues } = useFormContext<CheckFormValues>();

  const errors = useRelevantErrors();

  // Need to re-fetch entries if errors change
  const entries = useMemo(() => {
    return getValues(field);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field, getValues, errors]);

  return (
    <Stack direction="column" gap={FIELD_SPACING}>
      <Text element="h3" variant="h6">
        Request assertions
      </Text>
      {entries.map((entry, index) => {
        // Simplest way to maintain collapsible state while moving stuff around
        const isOpen = watch(createPath(field, index, '_isOpen.request'), true);
        const hasError =
          errors && errors.length ? getHasSectionError([createPath(field, index, 'checks')], errors) : false;

        const handleToggle = () => setValue(createPath(field, index, '_isOpen.request'), !isOpen);
        return (
          <CollapsibleRequestEntry
            hasError={hasError}
            isOpen={isOpen}
            key={`${entry.request.url}entry-${index}`}
            method={entry.request.method}
            target={entry.request.url}
            onToggle={handleToggle}
            aria-label={`Request assertion ${index + 1}`}
          >
            <MultiHttpUptimeAssertions field={createPath(field, index, 'checks')} />
          </CollapsibleRequestEntry>
        );
      })}
    </Stack>
  );
}

interface MultiHttpUptimeAssertionsProps {
  field: `settings.multihttp.entries.${number}.checks`;
}

// All possible fields need to exist, else a `z.literal` error will trigger before required fields are added
const newAssertion: Assertion & { expression: string } = {
  type: MultiHttpAssertionType.Text,
  condition: AssertionConditionVariant.Contains,
  subject: AssertionSubjectVariant.ResponseBody,
  value: '',
  expression: '',
};

function MultiHttpUptimeAssertions({ field }: MultiHttpUptimeAssertionsProps) {
  const {
    control,
    formState: { disabled },
  } = useFormContext<CheckFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: field });

  const theme = useTheme2();

  return (
    <Stack direction="column" gap={FIELD_SPACING}>
      <div
        className={css`
          display: grid;
          grid-template-columns: minmax(auto, 120px) minmax(auto, 120px) auto auto 24px;
          & > * {
            align-self: flex-end;
          }
          gap: ${theme.spacing(1)};
          row-gap: ${theme.spacing(2)};
        `}
      >
        {fields.map((arrayField, index) => {
          return (
            <Fragment key={arrayField.id}>
              <GenericInputSelectField
                field={createPath(field, index, 'type')}
                options={MULTI_HTTP_ASSERTION_TYPE_OPTIONS}
                label="Assertion type"
                description="Method for finding assertion value."
                width={0}
              />
              <AssertionFields field={createPath(field, index)} assertionIndex={index} />
              <div
                className={css`
                  height: ${theme.spacing(theme.components.height.md)}; // height of a normal input
                  align-self: flex-end;
                  display: flex;
                  align-items: center;
                `}
              >
                <IconButton
                  name="minus"
                  onClick={() => {
                    remove(index);
                  }}
                  tooltip="Delete"
                />
              </div>
            </Fragment>
          );
        })}
      </div>
      <div>
        <Button
          disabled={disabled}
          icon="plus"
          onClick={() => {
            append(newAssertion);
          }}
          size="sm"
          type="button"
          variant="secondary"
        >
          Assertion
        </Button>
      </div>
    </Stack>
  );
}

function AssertionFields({
  field,
  assertionIndex,
}: {
  field: `settings.multihttp.entries.${number}.checks.${number}`;
  assertionIndex: number;
}) {
  const { watch } = useFormContext<CheckFormValues>();

  const type = watch(createPath(field, 'type'));

  switch (type) {
    case MultiHttpAssertionType.Text:
      return (
        <>
          <GenericInputSelectField
            field={createPath(field, 'subject')}
            options={ASSERTION_SUBJECT_OPTIONS as Array<ComboboxOption<AssertionSubjectVariant>>}
            label="Subject"
            description="Target value to assert against."
            width={0}
            aria-label={`Assertion subject ${assertionIndex + 1}`}
          />
          <GenericInputSelectField
            field={createPath(field, 'condition')}
            options={ASSERTION_CONDITION_OPTIONS as Array<ComboboxOption<AssertionConditionVariant>>}
            label="Condition"
            description="Comparator"
            width={0}
            aria-label={`Assertion condition ${assertionIndex + 1}`}
          />
          <GenericInputField
            field={createPath(field, 'value')}
            label="Value"
            description="Value to compare with Subject"
            placeholder="Value"
            aria-label={`Assertion value ${assertionIndex + 1}`}
          />
        </>
      );
    case MultiHttpAssertionType.JSONPathValue:
      return (
        <>
          <GenericInputField
            field={createPath(field, 'expression')}
            label="Expression"
            aria-label={`Assertion expression ${assertionIndex + 1}`}
            placeholder="Path lookup using GJSON syntax"
            description={
              <a
                href="https://github.com/tidwall/gjson#path-syntax"
                style={{ textDecoration: 'underline' }}
                target="_blank"
                rel="noreferrer noopener"
              >
                See here for selector syntax
              </a>
            }
          />
          <GenericInputSelectField
            field={createPath(field, 'condition')}
            options={ASSERTION_CONDITION_OPTIONS as Array<ComboboxOption<AssertionConditionVariant>>}
            label="Condition"
            aria-label={`Assertion condition ${assertionIndex + 1}`}
            description="Comparator"
            width={0}
          />
          <GenericInputField
            field={createPath(field, 'value')}
            label="Value"
            aria-label={`Assertion value ${assertionIndex + 1}`}
            description="Value to compare with result of expression."
            placeholder="Value"
          />
        </>
      );
    case MultiHttpAssertionType.JSONPath:
      return (
        <div
          className={css`
            grid-column: 2 / span 3;
          `}
        >
          <GenericInputField
            field={createPath(field, 'expression')}
            label="Expression"
            aria-label={`Assertion expression ${assertionIndex + 1}`}
            placeholder="Path lookup using GJSON syntax"
            description={
              <a
                href="https://github.com/tidwall/gjson#path-syntax"
                style={{ textDecoration: 'underline' }}
                target="_blank"
                rel="noreferrer noopener"
              >
                See here for selector syntax
              </a>
            }
          />
        </div>
      );
    case MultiHttpAssertionType.Regex:
      return (
        <>
          <GenericInputSelectField
            field={createPath(field, 'subject')}
            options={ASSERTION_SUBJECT_OPTIONS as Array<ComboboxOption<AssertionSubjectVariant>>}
            label="Subject"
            aria-label={`Assertion subject ${assertionIndex + 1}`}
            description="Target value to assert against."
            width={0}
          />
          <div
            className={css`
              grid-column: 3 / span 2;
            `}
          >
            <GenericInputField
              field={createPath(field, 'expression')}
              label="Expression"
              aria-label={`Assertion expression ${assertionIndex + 1}`}
              placeholder=".*"
              description="Regex string without leading or trailing slashes"
            />
          </div>
        </>
      );
    default:
      return null;
  }
}
