import React from 'react';
import { Field } from '@grafana/ui';
import { NameValueInput } from './NameValueInput';
import { validateLabelName, validateLabelValue } from 'validation';
import { useFormContext } from 'react-hook-form';

interface Props {
  isEditor: boolean;
  limit?: number;
}

export const LabelField = ({ isEditor, limit }: Props) => {
  const { watch } = useFormContext();
  const labels = watch('labels');
  return (
    <Field
      label="Labels"
      description="Custom labels to be included with collected metrics and logs."
      disabled={!isEditor}
    >
      <NameValueInput
        name="labels"
        disabled={!isEditor}
        label="label"
        limit={limit ?? 10}
        validateName={(labelName) => validateLabelName(labelName, labels)}
        validateValue={validateLabelValue}
      />
    </Field>
  );
};
