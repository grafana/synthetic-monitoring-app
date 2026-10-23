import React from 'react';
import { Combobox, ComboboxOption } from '@grafana/ui';

import { KGServiceProperty, useKGServicePropertyOptions } from './KnowledgeGraphServiceLink.hooks';

interface KnowledgeGraphValueComboboxProps {
  property: KGServiceProperty;
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  isClearable?: boolean;
  emptyOptionLabel?: string;
  ['aria-labelledby']?: string;
}

/**
 * Service/namespace suggestions shared by connection rows and CAL inputs.
 * CALs keep per-field clearing; connection rows opt out in favour of row removal.
 */
export function KnowledgeGraphValueCombobox({
  property,
  value,
  onChange,
  disabled,
  placeholder,
  id,
  isClearable = true,
  emptyOptionLabel,
  'aria-labelledby': ariaLabelledBy,
}: KnowledgeGraphValueComboboxProps) {
  const options = useKGServicePropertyOptions(property);
  const emptyOption = emptyOptionLabel ? { value: '', label: emptyOptionLabel } : undefined;

  return (
    <Combobox
      options={emptyOption ? [emptyOption, ...options] : options}
      value={value ?? emptyOption ?? null}
      {...(isClearable
        ? {
            isClearable: true as const,
            onChange: (option: ComboboxOption<string> | null) => onChange(option?.value ?? ''),
          }
        : { isClearable: false as const, onChange: (option: ComboboxOption<string>) => onChange(option.value) })}
      placeholder={placeholder}
      createCustomValue
      disabled={disabled}
      id={id}
      aria-labelledby={ariaLabelledBy}
    />
  );
}
