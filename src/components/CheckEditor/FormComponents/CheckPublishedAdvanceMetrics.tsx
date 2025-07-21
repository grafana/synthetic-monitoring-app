import React from 'react';
import { useFormContext } from 'react-hook-form';

import { CheckFormValues } from 'types';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';

export const CheckPublishedAdvanceMetrics = () => {
  const { register, formState } = useFormContext<CheckFormValues>();

  return (
    <HorizontalCheckboxField
      id="publishAdvancedMetrics"
      label="Publish full set of metrics"
      description="Histogram buckets are removed by default in order to reduce the amount of active series generated per check. If you want to calculate Apdex scores or visualize heatmaps, publish the full set of metrics."
      disabled={formState.disabled}
      data-fs-element="Publish advanced metrics checkbox"
      {...register('publishAdvancedMetrics')}
    />
  );
};
