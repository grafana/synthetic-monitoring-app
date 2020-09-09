import React, { FC } from 'react';
import { Field } from '@grafana/ui';
import SMLabelsForm from 'components/SMLabelsForm';
import { validateLabels } from 'validation';
import { Label } from 'types';

interface Props {
  labels: Label[];
  onLabelsUpdate: (labels: Label[]) => void;
  isEditor: boolean;
}

export const LabelField: FC<Props> = ({ labels, onLabelsUpdate, isEditor }) => (
  <Field
    label="Labels"
    description="Custom labels to be included with collected metrics and logs."
    disabled={!isEditor}
    invalid={!validateLabels(labels)}
  >
    <SMLabelsForm labels={labels} onUpdate={onLabelsUpdate} isEditor={isEditor} type="Label" limit={5} />
  </Field>
);
