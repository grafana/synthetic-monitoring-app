import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field } from '@grafana/ui';

import { Label } from 'types';
import { hasRole } from 'utils';
import { validateLabelName, validateLabelValue } from 'validation';
import { NameValueInput } from 'components/NameValueInput';

export interface LabelFieldProps {
  limit?: number;
}

type FormWithLabels = {
  labels: Label[];
};

export const LabelField = <T extends FormWithLabels>({ limit }: LabelFieldProps) => {
  const { watch } = useFormContext<FormWithLabels>();
  const labels = watch('labels');
  const isEditor = hasRole(OrgRole.Editor);

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
        data-fs-element="Labels input"
      />
    </Field>
  );
};
