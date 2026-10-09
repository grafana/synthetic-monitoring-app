import React from 'react';
import { Field, Input } from '@grafana/ui';

import { getHttpUrlProtocolSuggestions, validateHttpTarget } from 'validation';
import { ProtocolSuggestionHint } from 'components/ProtocolSuggestionHint';

const URL_INPUT_ID = 'template-url';

export const URL_FORMAT_ERROR = 'Enter a valid URL starting with https:// or http://.';

export function parseHttpUrl(value: string) {
  try {
    const parsed = new URL(value.trim());
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return undefined;
    }
    return validateHttpTarget(parsed.href) === undefined ? parsed : undefined;
  } catch {
    return undefined;
  }
}

interface TemplateUrlFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  /** Error from the last submit attempt. Once the user types, validation is live instead. */
  submitError?: string;
}

/** URL input shared by the check templates: live validation plus a "Did you mean https://…?" hint. */
export function TemplateUrlField({ label, value, onChange, submitError, autoFocus = true }: TemplateUrlFieldProps) {
  const error = value.trim() ? (parseHttpUrl(value) ? undefined : URL_FORMAT_ERROR) : submitError;

  return (
    <>
      <Field label={label} required htmlFor={URL_INPUT_ID} error={error} invalid={!!error}>
        <Input
          id={URL_INPUT_ID}
          type="url"
          required
          autoFocus={autoFocus}
          placeholder="https://grafana.com"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      </Field>
      <ProtocolSuggestionHint
        suggestions={getHttpUrlProtocolSuggestions(value)}
        onSelect={onChange}
        marginBottom={2}
        inputId={URL_INPUT_ID}
      />
    </>
  );
}
