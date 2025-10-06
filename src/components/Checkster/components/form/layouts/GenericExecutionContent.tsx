import React from 'react';

import { SectionContent } from '../../ui/SectionContent';
import { UsageEstimation } from '../../UsageEstimation';
import { GenericCheckboxField } from '../generic/GenericCheckboxField';
import { GenericFrequencyField } from '../generic/GenericFrequencyField';
import { GenericProbesSelectField } from '../generic/GenericProbesSelectField';

export function GenericExecutionContent({ publishAdvancedMetrics }: { publishAdvancedMetrics: boolean }) {
  return (
    <SectionContent>
      <GenericProbesSelectField />
      <GenericFrequencyField />
      {publishAdvancedMetrics && (
        <GenericCheckboxField
          field="publishAdvancedMetrics"
          label="Publish full set of metrics"
          description="Histogram buckets are removed by default in order to reduce the amount of active series generated per check. If you want to calculate Apdex scores or visualize heatmaps, publish the full set of metrics."
        />
      )}
      <UsageEstimation />
    </SectionContent>
  );
}
