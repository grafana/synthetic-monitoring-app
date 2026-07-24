import { HeaderMetricDefinition } from 'dashboards/components/CheckDashboardHeader';
import {
  panelDataToTrendSamples,
  selectRatioSparklineSeries,
  selectSparklineSeries,
} from 'dashboards/components/CheckDashboardHeader/headerMetricSparkline.utils';
import {
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

import { CheckAlertType, HTTPCheck } from 'types';
import { formatDuration } from 'utils';

import {
  createLatencyBaselineDefinition,
  createReachabilityBaselineDefinition,
  createUptimeBaselineDefinition,
} from './health/httpBaselineDefinitions';
import {
  createAverageLatencySparklineDefinition,
  createReachabilitySparklineDefinition,
  createUptimeSparklineDefinition,
} from './httpHeaderSparklineDefinitions';
import { compareLatency, comparePercentagePoints, compareSslCertificate } from './httpMetricComparison';

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
  const uptimeBaselineDefinition = createUptimeBaselineDefinition(check);
  const reachabilityBaselineDefinition = createReachabilityBaselineDefinition();
  const latencyBaselineDefinition = createLatencyBaselineDefinition();

  return [
    {
      id: 'uptime',
      label: 'Uptime',
      description: uptimeDefinition.description ?? 'Successful checks over the selected time range.',
      definition: uptimeDefinition,
      selectValue: (data) => selectNumericValue(data),
      formatValue: formatPercent,
      comparison: {
        supportsNormalBand: true,
        normalBaseline: {
          definition: uptimeBaselineDefinition,
          selectSamples: panelDataToTrendSamples,
        },
        normalBandDomain: { min: 0, max: 1 },
        compare: comparePercentagePoints,
      },
      sparkline: {
        definition: createUptimeSparklineDefinition(check),
        selectSeries: selectRatioSparklineSeries,
      },
    },
    {
      id: 'reachability',
      label: 'Reachability',
      description: reachabilityDefinition.description ?? 'Successful probe executions over the selected time range.',
      definition: reachabilityDefinition,
      selectValue: (data) => selectNumericValue(data),
      formatValue: formatPercent,
      comparison: {
        supportsNormalBand: true,
        normalBaseline: {
          definition: reachabilityBaselineDefinition,
          selectSamples: panelDataToTrendSamples,
        },
        normalBandDomain: { min: 0, max: 1 },
        compare: comparePercentagePoints,
      },
      sparkline: {
        definition: createReachabilitySparklineDefinition(check),
        selectSeries: selectRatioSparklineSeries,
      },
      health: {
        alertTypes: [CheckAlertType.ProbeFailedExecutionsTooHigh],
      },
    },
    {
      id: 'average-latency',
      label: 'Average latency',
      description: latencyDefinition.description ?? 'Average duration of HTTP probe executions.',
      definition: latencyDefinition,
      selectValue: (data) => selectNumericValue(data),
      formatValue: formatSeconds,
      comparison: {
        supportsNormalBand: true,
        normalBaseline: {
          definition: latencyBaselineDefinition,
          selectSamples: panelDataToTrendSamples,
        },
        normalBandDomain: { min: 0 },
        compare: compareLatency,
      },
      sparkline: {
        definition: createAverageLatencySparklineDefinition(check),
        selectSeries: selectSparklineSeries,
      },
      health: {
        alertTypes: [CheckAlertType.HTTPRequestDurationTooHighAvg],
      },
    },
    {
      id: 'ssl-expiry',
      label: 'SSL expiry',
      description: sslDefinition.description ?? 'Time remaining until the earliest certificate in the chain expires.',
      definition: sslDefinition,
      selectValue: (data) => selectNumericValue(data),
      formatValue: formatSslRemaining,
      comparison: {
        supportsNormalBand: false,
        compare: compareSslCertificate,
      },
      sparkline: {
        definition: sslDefinition,
        selectSeries: selectSparklineSeries,
      },
      health: {
        alertTypes: [CheckAlertType.TLSTargetCertificateCloseToExpiring],
      },
    },
  ];
}
