import { useContext } from 'react';

import { CheckStatus, CheckType, CheckTypeGroup, FeatureName } from 'types';
import { FeatureFlagContext } from 'contexts/FeatureFlagContext';

export const CHECK_TYPE_OPTIONS = [
  {
    label: 'HTTP',
    value: CheckType.HTTP,
    description: 'Measures a web endpoint for availability, response time, SSL certificate expiration and more.',
    group: CheckTypeGroup.ApiTest,
  },
  {
    label: 'Ping',
    value: CheckType.PING,
    description: 'Check a host for availability and response time.',
    group: CheckTypeGroup.ApiTest,
  },
  {
    label: 'gRPC',
    value: CheckType.GRPC,
    description: 'Use the gRPC Health Checking Protocol to ensure a gRPC service is healthy.',
    status: {
      value: CheckStatus.EXPERIMENTAL,
      description: `gRPC checks are experimental. We're actively working on improving the experience and adding more features.`,
    },
    featureToggle: FeatureName.GRPCChecks,
    group: CheckTypeGroup.ApiTest,
  },
  {
    label: 'DNS',
    value: CheckType.DNS,
    description: 'Ensures a domain resolves and measures the average time for the resolution to happen.',
    group: CheckTypeGroup.ApiTest,
  },
  {
    label: 'TCP',
    value: CheckType.TCP,
    description: 'Ensures a hostname and port accept a connection and measures performance.',
    group: CheckTypeGroup.ApiTest,
  },
  {
    label: 'Traceroute',
    value: CheckType.Traceroute,
    description: 'Trace the path of a request through the internet.',
    group: CheckTypeGroup.ApiTest,
  },
  {
    label: 'MultiHttp',
    value: CheckType.MULTI_HTTP,
    description: 'Check multiple web endpoints in sequence.',
    group: CheckTypeGroup.MultiStep,
  },
  {
    label: 'Scripted',
    value: CheckType.Scripted,
    description: 'Write a k6 script to run custom checks.',
    status: {
      value: CheckStatus.PUBLIC_PREVIEW,
      description: `Scripted checks are in public preview. We're actively working on improving the experience and adding more features.`,
    },
    featureToggle: FeatureName.ScriptedChecks,
    group: CheckTypeGroup.Scripted,
  },
  {
    label: 'Browser',
    value: CheckType.Browser,
    description: 'Leverage k6 browser module to run checks in a browser.',
    status: {
      value: CheckStatus.PUBLIC_PREVIEW,
      description: `Browser checks are in public preview. During the preview they are free to use: test executions will not be billed.`,
      docsLink:
        'https://grafana.com/docs/grafana-cloud/cost-management-and-billing/understand-your-invoice/synthetic-monitoring-invoice/',
    },
    featureToggle: FeatureName.BrowserChecks,
    group: CheckTypeGroup.Browser,
  },
];

export function useCheckTypeOptions() {
  const { isFeatureEnabled } = useContext(FeatureFlagContext);

  return CHECK_TYPE_OPTIONS.filter((option) => {
    if (option.featureToggle) {
      return isFeatureEnabled(option.featureToggle);
    }

    return true;
  });
}
