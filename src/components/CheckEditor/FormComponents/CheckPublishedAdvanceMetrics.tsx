import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';

import { CheckFormValues } from 'types';
import { hasRole } from 'utils';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';

export const CheckPublishedAdvanceMetrics = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const { register } = useFormContext<CheckFormValues>();

  return (
    <HorizontalCheckboxField
      id="publishAdvancedMetrics"
      label="Publish full set of metrics"
      description="Histogram buckets are removed by default in order to reduce the amount of active series generated per check. If you want to calculate Apdex scores or visualize heatmaps, publish the full set of metrics."
      disabled={!isEditor}
      {...register('publishAdvancedMetrics')}
    />
  );
};
