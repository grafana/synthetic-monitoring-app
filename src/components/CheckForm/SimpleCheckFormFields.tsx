import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';

import { Check, CheckFormValues, CheckType } from 'types';
import { hasRole } from 'utils';
import { validateTarget } from 'validation';
import { CheckSettings } from 'components/CheckEditor/CheckSettings';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import CheckTarget from 'components/CheckTarget';
import { CheckUsage } from 'components/CheckUsage';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';

export const SimpleCheckFormFields = ({ check, checkType }: { check: Check; checkType: CheckType }) => {
  const isEditor = hasRole(OrgRole.Editor);
  const { control, formState, register } = useFormContext<CheckFormValues>();

  return (
    <>
      <Controller<CheckFormValues>
        name="target"
        control={control}
        rules={{
          required: { value: true, message: 'Target is required' },
          validate: (target) => {
            return validateTarget(checkType, target);
          },
        }}
        render={({ field }) => (
          <CheckTarget
            {...field}
            typeOfCheck={checkType}
            invalid={Boolean(formState.errors.target)}
            error={formState.errors.target?.message}
            disabled={!isEditor}
          />
        )}
      />
      <ProbeOptions isEditor={isEditor} checkType={checkType} timeout={check.timeout} frequency={check.frequency} />
      <HorizontalCheckboxField
        id="publishAdvancedMetrics"
        label="Publish full set of metrics"
        description="Histogram buckets are removed by default in order to reduce the amount of active series generated per check. If you want to calculate Apdex scores or visualize heatmaps, publish the full set of metrics."
        {...register('publishAdvancedMetrics')}
      />
      <CheckUsage />
      <CheckSettings typeOfCheck={checkType} isEditor={isEditor} />
    </>
  );
};
