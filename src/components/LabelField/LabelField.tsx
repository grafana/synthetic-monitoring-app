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
  labelDestination: 'check' | 'probe';
}

type FormWithLabels = {
  labels: Label[];
};

export const LabelField = <T extends FormWithLabels>({ labelDestination }: LabelFieldProps) => {
  const { data: limits } = useTenantLimits();
  const { watch } = useFormContext<FormWithLabels>();
  const labels = watch('labels');
  const isEditor = hasRole(OrgRole.Editor);
  let description = '';
  let limit = 10;
  if (labelDestination === 'check') {
    description = `Custom labels to be included with collected metrics and logs. You can add up to 3.`;
    limit = 3;
  } else {
    description = `Custom labels to be included with collected metrics and logs. You can add up to ${
      limits?.maxAllowedMetricLabels ?? 10
    }. If you add more than ${
      limits?.maxAllowedLogLabels ?? 5
    } labels, they will potentially not be used to index logs, and rather added as part of the log message.`;
    limit = limits?.maxAllowedMetricLabels ?? 10;
  }

  return (
    <Field label="Labels" description={description} disabled={!isEditor}>
      <NameValueInput
        name="labels"
        disabled={!isEditor}
        label="label"
        limit={limit}
        validateName={(labelName) => validateLabelName(labelName, labels)}
        validateValue={validateLabelValue}
      />
    </Field>
  );
};
