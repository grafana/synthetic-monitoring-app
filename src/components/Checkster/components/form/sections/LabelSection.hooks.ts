import { useTenantCostAttributionLabels } from 'data/useTenantCostAttributionLabels';
import { useTenantLimits } from 'data/useTenantLimits';

import { DEFAULT_MAX_ALLOWED_LOG_LABELS, DEFAULT_MAX_ALLOWED_METRIC_LABELS } from '../../../constants';

export function useLabelSectionData() {
  const { data: limits, isLoading: limitsLoading, error, isRefetching, refetch } = useTenantLimits();
  const { data: calData, isLoading: calsLoading } = useTenantCostAttributionLabels();

  const maxAllowedMetricLabels = limits?.maxAllowedMetricLabels ?? DEFAULT_MAX_ALLOWED_METRIC_LABELS;
  const maxAllowedLogLabels = limits?.maxAllowedLogLabels ?? DEFAULT_MAX_ALLOWED_LOG_LABELS;
  const calNames = calData?.names ?? [];

  return {
    error,
    isRefetching,
    refetch,
    isLoading: (limitsLoading && !limits) || (calsLoading && !calData),
    // Cost attribution labels count against the tenant's label allowance, so they reduce the
    // number of custom labels a check can still add.
    customLabelLimit: maxAllowedMetricLabels - calNames.length,
    description: `Custom labels to be included with collected metrics and logs. You can add up to ${maxAllowedMetricLabels}. If you add more than ${maxAllowedLogLabels} labels, they will potentially not be used to index logs, and rather added as part of the log message.`,
  };
}
