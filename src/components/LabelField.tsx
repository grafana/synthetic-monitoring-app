import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Field } from '@grafana/ui';

import { validateLabelName, validateLabelValue } from 'validation';

import { NameValueInput } from './NameValueInput';

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
      description="Custom labels to be included with collected metrics and logs. You can add up to three."
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
