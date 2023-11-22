import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Field } from '@grafana/ui';

import { validateLabelName, validateLabelValue } from 'validation';
import { NameValueInput } from 'components/NameValueInput';

export interface LabelFieldProps {
  isEditor: boolean;
  limit?: number;
}

export const LabelField = ({ isEditor, limit }: LabelFieldProps) => {
  const { watch } = useFormContext();
  const labels = watch('labels');

  let description = `Custom labels to be included with collected metrics and logs.`;

  if (limit) {
    description += ` You can add up to ${limit}.`;
  }

  return (
    <Field label="Labels" description={description} disabled={!isEditor}>
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
