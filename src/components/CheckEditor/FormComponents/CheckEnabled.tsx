import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';

import { CheckFormValues } from 'types';
import { hasRole } from 'utils';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';

export const CheckEnabled = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const { register } = useFormContext<CheckFormValues>();

  return (
    <HorizontalCheckboxField
      disabled={!isEditor}
      id="check-form-enabled"
      label="Enabled"
      description="If a check is enabled, metrics and logs are published to your Grafana Cloud stack."
      {...register('enabled')}
    />
  );
};
