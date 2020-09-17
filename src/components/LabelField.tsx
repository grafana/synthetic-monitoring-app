import React, { FC } from 'react';
import { Field } from '@grafana/ui';
import { NameValueInput } from './NameValueInput';
import { validateLabelName, validateLabelValue } from 'validation';

interface Props {
  isEditor: boolean;
  limit?: number;
}

export const LabelField: FC<Props> = ({ isEditor, limit }) => {
  return (
    <Field
      label="Labels"
      description="Custom labels to be included with collected metrics and logs."
      disabled={!isEditor}
    >
      <NameValueInput
        name="labels"
        disabled={!isEditor}
        label="Label"
        limit={limit ?? 5}
        validateName={validateLabelName}
        validateValue={validateLabelValue}
      />
    </Field>
  );
};
