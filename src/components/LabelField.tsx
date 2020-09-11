import React, { FC } from 'react';
import { Field } from '@grafana/ui';
// import { validateLabels } from 'validation';
import { NameValueInput } from './NameValueInput';

interface Props {
  isEditor: boolean;
  limit?: number;
}

export const LabelField: FC<Props> = ({ isEditor, limit }) => (
  <Field
    label="Labels"
    description="Custom labels to be included with collected metrics and logs."
    disabled={!isEditor}
    // invalid={!validateLabels(labels)}
  >
    <NameValueInput name="labels" disabled={!isEditor} label="Label" limit={limit ?? 5} />
  </Field>
);
