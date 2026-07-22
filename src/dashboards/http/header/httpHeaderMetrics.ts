import { HeaderMetricDefinition } from 'dashboards/components/CheckDashboardHeader';
import {
  formatDateFromNow,
  formatPercent,
  formatSeconds,
  selectNumericValue,
} from 'dashboards/components/CheckDashboardHeader/headerMetricValue';
import {
  createAverageLatencyPanelDefinition,
  createReachabilityPanelDefinition,
  createSslExpiryPanelDefinition,
  createUptimePanelDefinition,
} from 'dashboards/http/panels/headlinePanelDefinitions';

import { HTTPCheck } from 'types';
import { formatDuration } from 'utils';

import { createExecutionCountsDefinition } from './httpHeaderQueryDefinitions';
import { selectExecutionCounts } from './httpHeaderSelectors';

function formatExecutionCounts(data: Parameters<typeof selectExecutionCounts>[0]) {
  const { total, successful, failed } = selectExecutionCounts(data);

  if (total === null || successful === null || failed === null) {
    return undefined;
  }

  return `${Math.round(successful).toLocaleString()} of ${Math.round(total).toLocaleString()} succeeded · ${Math.round(failed).toLocaleString()} failed`;
}

function formatSslRemaining(value: number | null) {
  if (value === null) {
    return 'N/A';
  }

  return value >= 86_400 ? `${Math.floor(value / 86_400).toLocaleString()}d` : formatDuration(value * 1000, true);
}

export function getHttpHeaderMetrics(check: HTTPCheck): Array<HeaderMetricDefinition<HTTPCheck>> {
  const uptimeDefinition = createUptimePanelDefinition(check);
  const reachabilityDefinition = createReachabilityPanelDefinition(check);
  const latencyDefinition = createAverageLatencyPanelDefinition();
  const sslDefinition = createSslExpiryPanelDefinition();

  return [
    {
      id: 'uptime',
      label: 'Uptime',
      description: uptimeDefinition.description ?? 'Successful checks over the selected time range.',
      definition: uptimeDefinition,
      selectValue: (data) => selectNumericValue(data),
      formatValue: formatPercent,
      getSecondaryText: () => 'From at least one location',
    },
    {
      id: 'reachability',
      label: 'Reachability',
      description: reachabilityDefinition.description ?? 'Successful probe executions over the selected time range.',
      definition: reachabilityDefinition,
      selectValue: (data) => selectNumericValue(data),
      formatValue: formatPercent,
      secondary: {
        definition: createExecutionCountsDefinition(),
        selectText: formatExecutionCounts,
      },
    },
    {
      id: 'average-latency',
      label: 'Average latency',
      description: latencyDefinition.description ?? 'Average duration of HTTP probe executions.',
      definition: latencyDefinition,
      selectValue: (data) => selectNumericValue(data),
      formatValue: formatSeconds,
      getSecondaryText: () => 'Across selected probes',
    },
    {
      id: 'ssl-expiry',
      label: 'SSL expiry',
      description: sslDefinition.description ?? 'Time remaining until the earliest certificate in the chain expires.',
      definition: sslDefinition,
      selectValue: (data) => selectNumericValue(data),
      formatValue: formatSslRemaining,
      getSecondaryText: (value) => {
        const date = formatDateFromNow(value);
        return date ? `Expires ${date}` : undefined;
      },
    },
  ];
}
