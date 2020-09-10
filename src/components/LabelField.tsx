import React, { FC } from 'react';
import { Field } from '@grafana/ui';
import { Controller } from 'react-hook-form';
import SMLabelsForm from 'components/SMLabelsForm';
import { validateLabels } from 'validation';
import { Label } from 'types';

interface Props {
  labels: Label[];
  isEditor: boolean;
}

export const LabelField: FC<Props> = ({ labels, isEditor }) => (
  <Field
    label="Labels"
    description="Custom labels to be included with collected metrics and logs."
    disabled={!isEditor}
    invalid={!validateLabels(labels)}
  >
    <Controller as={SMLabelsForm} name="labels" labels={labels} isEditor={isEditor} type="Label" limit={5} />
  </Field>
);
