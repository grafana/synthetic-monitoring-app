import { CheckStatus, CheckType, CheckTypeGroup, FeatureName } from 'types';

// Kept apart from the hook so utils.ts and routing/utils.ts, which the datasource and
// preload bundles reach, don't pull the OpenFeature SDK in with it.
export const CHECK_TYPE_OPTIONS = [
  {
    label: 'HTTP',
    value: CheckType.Http,
    description: 'Measures a web endpoint for availability, response time, SSL certificate expiration and more.',
    group: CheckTypeGroup.ApiTest,
  },
  {
    label: 'Ping',
    value: CheckType.Ping,
    description: 'Check a host for availability and response time.',
    group: CheckTypeGroup.ApiTest,
  },
  {
    label: 'gRPC',
    value: CheckType.Grpc,
    description: 'Use the gRPC Health Checking Protocol to ensure a gRPC service is healthy.',
    status: {
      value: CheckStatus.Experimental,
      description: `gRPC checks are experimental. We're actively working on improving the experience and adding more features.`,
    },
    featureToggle: FeatureName.GRPCChecks,
    group: CheckTypeGroup.ApiTest,
  },
  {
    label: 'DNS',
    value: CheckType.Dns,
    description: 'Ensures a domain resolves and measures the average time for the resolution to happen.',
    group: CheckTypeGroup.ApiTest,
  },
  {
    label: 'TCP',
    value: CheckType.Tcp,
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
    value: CheckType.MultiHttp,
    description: 'Check multiple web endpoints in sequence.',
    group: CheckTypeGroup.MultiStep,
  },
  {
    label: 'Scripted',
    value: CheckType.Scripted,
    description: 'Write a k6 script to run custom checks.',
    group: CheckTypeGroup.Scripted,
  },
  {
    label: 'Browser',
    value: CheckType.Browser,
    description: 'Leverage k6 browser module to run checks in a browser.',
    group: CheckTypeGroup.Browser,
  },
];
