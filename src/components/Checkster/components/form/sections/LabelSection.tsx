import React from 'react';

import { FormSectionName } from '../../../types';
import { useTenantLimits } from 'data/useTenantLimits';
import { LimitsFetchWarning } from 'components/LabelField';

import { DEFAULT_MAX_ALLOWED_LOG_LABELS, DEFAULT_MAX_ALLOWED_METRIC_LABELS } from '../../../constants';
import { FormSection } from '../FormSection';
import { GenericLabelContent } from '../layouts/GenericLabelContent';

export const LABEL_SECTION_FIELDS = ['labels'];

export function LabelSection() {
  // TODO: Pipe this data through the front door? Meaning as a prop to Checkster/ChecksterProvider (tenantLimits)
  const { data: limits, isLoading, error, isRefetching, refetch } = useTenantLimits();
  const maxAllowedMetricLabels = limits?.maxAllowedMetricLabels ?? DEFAULT_MAX_ALLOWED_METRIC_LABELS;
  const maxAllowedLogLabels = limits?.maxAllowedLogLabels ?? DEFAULT_MAX_ALLOWED_LOG_LABELS;
  const description = `Custom labels to be included with collected metrics and logs. You can add up to ${maxAllowedMetricLabels}. If you add more than ${maxAllowedLogLabels} labels, they will potentially not be used to index logs, and rather added as part of the log message.`;

  return (
    <FormSection sectionName={FormSectionName.Labels} fields={LABEL_SECTION_FIELDS}>
      {error && (
        <div>
          <LimitsFetchWarning refetch={refetch} isRefetching={isRefetching} error={error} />
        </div>
      )}
      <GenericLabelContent description={description} isLoading={isLoading} />
    </FormSection>
  );
}
