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
  ['aria-labelledby']?: string;
}

/**
 * Combobox for a KG-linked label value (Service name / namespace), with suggestions from
 * the Knowledge Graph. Shared by the KG service-link section and the CAL rows so both
 * editing surfaces look and behave the same.
 */
export function KnowledgeGraphValueCombobox({
  property,
  value,
  onChange,
  disabled,
  placeholder,
  id,
  'aria-labelledby': ariaLabelledBy,
}: KnowledgeGraphValueComboboxProps) {
  const options = useKGServicePropertyOptions(property);

  return (
    <Combobox
      options={options}
      value={value ?? null}
      onChange={(option: ComboboxOption<string> | null) => onChange(option?.value ?? '')}
      placeholder={placeholder}
      createCustomValue
      isClearable
      disabled={disabled}
      id={id}
      aria-labelledby={ariaLabelledBy}
    />
  );
}
