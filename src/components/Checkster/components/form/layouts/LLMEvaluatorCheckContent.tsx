import React, { Fragment, useMemo } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Combobox, ComboboxOption, IconButton, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValues } from 'types';
import { useSecrets } from 'data/useSecrets';

import { MAX_CRITERIA_COUNT } from '../../../../../schemas/forms/LLMEvaluatorCheckSchema';
import { FIELD_SPACING } from '../../../constants';
import { createPath, getFieldErrorProps } from '../../../utils/form';
import { Column } from '../../ui/Column';
import { SectionContent } from '../../ui/SectionContent';
import { StyledField } from '../../ui/StyledField';
import { ChooseCheckType } from '../ChooseCheckType';
import { FormJobField } from '../FormJobField';
import { GenericInputField } from '../generic/GenericInputField';
import { GenericTextareaField } from '../generic/GenericTextareaField';

export const LLM_EVALUATOR_CHECK_FIELDS = [
  'job',
  'target',
  'settings.llmEvaluator.endpoint',
  'settings.llmEvaluator.model',
  'settings.llmEvaluator.apiKeyRef',
  'settings.llmEvaluator.systemPrompt',
  'settings.llmEvaluator.prompt',
  'settings.llmEvaluator.criteria',
];

const CRITERIA_FIELD_PATH = 'settings.llmEvaluator.criteria' as const;

export function LLMEvaluatorCheckContent() {
  return (
    <SectionContent>
      <Column gap={FIELD_SPACING}>
        <FormJobField field="job" />
        <ChooseCheckType />

        <GenericInputField
          field="target"
          label="Instance"
          description="A unique label for this check (used as the Prometheus instance label)."
          placeholder="my-llm-check"
          required
        />

        <GenericInputField
          field="settings.llmEvaluator.endpoint"
          label="Endpoint URL"
          description="OpenAI-compatible base URL. The agent will POST to {endpoint}/v1/chat/completions."
          placeholder="https://api.openai.com"
          required
        />

        <GenericInputField
          field="settings.llmEvaluator.model"
          label="Model"
          description="Model name passed in the chat completions request body."
          placeholder="gpt-4o-mini"
          required
        />

        <ApiKeyRefField />

        <GenericTextareaField
          field="settings.llmEvaluator.systemPrompt"
          label="System prompt (optional)"
          description="Optional system message prepended to each request. Max 500 characters."
          rows={3}
        />

        <GenericTextareaField
          field="settings.llmEvaluator.prompt"
          label="Prompt"
          description="User message sent to the LLM on each execution. Max 2,000 characters."
          rows={5}
          required
        />

        <CriteriaList />
      </Column>
    </SectionContent>
  );
}

function ApiKeyRefField() {
  const {
    formState: { disabled, errors },
    setValue,
    watch,
  } = useFormContext<CheckFormValues>();
  const { data: secrets = [], isLoading } = useSecrets(true);
  const value = watch('settings.llmEvaluator.apiKeyRef' as any);

  const options: Array<ComboboxOption<string>> = useMemo(
    () => secrets.map((s) => ({ label: s.name, value: s.name, description: s.description })),
    [secrets]
  );

  return (
    <StyledField
      label="Target LLM API key"
      description="Select an SM Secret holding the bearer token for the target LLM."
      required
      {...getFieldErrorProps(errors, 'settings.llmEvaluator.apiKeyRef' as any)}
    >
      <Combobox
        value={value}
        options={options}
        loading={isLoading}
        disabled={disabled}
        placeholder={secrets.length === 0 ? 'No secrets configured — create one in Config → Secrets' : 'Select a secret'}
        onChange={(opt) => setValue('settings.llmEvaluator.apiKeyRef' as any, opt.value, { shouldDirty: true, shouldValidate: true })}
      />
    </StyledField>
  );
}

function CriteriaList() {
  const styles = useStyles2(getStyles);
  const {
    control,
    formState: { disabled, errors },
  } = useFormContext<CheckFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: CRITERIA_FIELD_PATH as any });

  const arrayErrors = (errors as any)?.settings?.llmEvaluator?.criteria;
  const rootError =
    typeof arrayErrors?.message === 'string'
      ? arrayErrors.message
      : typeof arrayErrors?.root?.message === 'string'
        ? arrayErrors.root.message
        : undefined;

  return (
    <Stack direction="column" gap={1}>
      <StyledField
        label="Evaluation criteria"
        description={`Up to ${MAX_CRITERIA_COUNT} natural-language assertions the judge LLM evaluates the response against. Each is a binary pass/fail.`}
        required
        invalid={Boolean(rootError)}
        error={rootError}
        emulate
      >
        <div />
      </StyledField>

      <div className={styles.list}>
        {fields.map((row, index) => (
          <Fragment key={row.id}>
            <GenericInputField
              field={createPath(CRITERIA_FIELD_PATH, index)}
              aria-label={`Criterion ${index + 1}`}
              placeholder={`Criterion ${index + 1} — e.g. "Response is under 100 words"`}
            />
            <IconButton
              disabled={disabled || fields.length <= 1}
              name="minus"
              onClick={() => remove(index)}
              tooltip="Remove criterion"
            />
          </Fragment>
        ))}
      </div>

      <Button
        className={css`
          align-self: flex-start;
        `}
        icon="plus"
        onClick={() => append('' as any)}
        variant="secondary"
        size="sm"
        type="button"
        disabled={disabled || fields.length >= MAX_CRITERIA_COUNT}
      >
        Add criterion
      </Button>
    </Stack>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    list: css`
      display: grid;
      grid-template-columns: 1fr min-content;
      gap: ${theme.spacing(1)};
      align-items: start;
    `,
  };
}
