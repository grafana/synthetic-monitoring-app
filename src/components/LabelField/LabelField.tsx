import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field } from '@grafana/ui';

import { Label } from 'types';
import { hasRole } from 'utils';
import { validateLabelName, validateLabelValue } from 'validation';
import { useTenantLimits } from 'data/useTenantLimits';
import { NameValueInput } from 'components/NameValueInput';

export interface LabelFieldProps {
  limit?: number;
}

type FormWithLabels = {
  labels: Label[];
};

export const LabelField = <T extends FormWithLabels>({ limit }: LabelFieldProps) => {
  const { data: limits } = useTenantLimits();
  const { watch } = useFormContext<FormWithLabels>();
  const labels = watch('labels');
  const isEditor = hasRole(OrgRole.Editor);
  let description = '';
  if (limit) {
    description = `Custom labels to be included with collected metrics and logs. You can add up to ${limit}.`;
  } else {
    description = `Custom labels to be included with collected metrics and logs. You can add up to ${
      limits?.maxAllowedMetricLabels ?? 10
    }. If you add more than ${
      limits?.maxAllowedLogLabels ?? 5
    } labels, they will potentially not be used to index logs, and rather added as part of the log message.`;
  }

  return (
    <Field label="Labels" description={limit || limits ? description : ''} disabled={!isEditor}>
      <NameValueInput
        name="labels"
        disabled={!isEditor}
        label="label"
        limit={limits?.maxAllowedMetricLabels ?? 10}
        validateName={(labelName) => validateLabelName(labelName, labels)}
        validateValue={validateLabelValue}
      />
    </Field>
  );
};
