import { useContext } from 'react';

import { CheckStatus, CheckType, FeatureName } from 'types';
import { FeatureFlagContext } from 'contexts/FeatureFlagContext';

const CHECK_TYPE_OPTIONS = [
  {
    label: 'HTTP',
    value: CheckType.HTTP,
    description: 'Measures a web endpoint for availability, response time, SSL certificate expiration and more.',
  },
  {
    label: 'MULTIHTTP',
    value: CheckType.MULTI_HTTP,
    description: 'Check multiple web endpoints in sequence.',
  },
  {
    label: 'PING',
    value: CheckType.PING,
    description: 'Check a host for availability and response time.',
  },
  {
    label: 'gRPC',
    value: CheckType.GRPC,
    description: 'Use the gRPC Health Checking Protocol to ensure a gRPC service is healthy',
    status: CheckStatus.EXPERIMENTAL,
    featureToggle: FeatureName.GRPCChecks,
  },
  {
    label: 'DNS',
    value: CheckType.DNS,
    description: 'Ensures a domain resolves and measures the average time for the resolution to happen.',
  },
  {
    label: 'TCP',
    value: CheckType.TCP,
    description: 'Ensures a hostname and port accept a connection and measures performance.',
  },
  {
    label: 'Traceroute',
    value: CheckType.Traceroute,
    description: 'Trace the path of a request through the internet.',
  },
  {
    label: 'Scripted',
    value: CheckType.Scripted,
    description: 'Write a k6 script to run custom checks.',
    status: CheckStatus.PUBLIC_PREVIEW,
    featureToggle: FeatureName.ScriptedChecks,
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
