import { useContext } from 'react';

import { CheckStatus, CheckType, CheckTypeGroup, FeatureName } from 'types';
import { FeatureFlagContext } from 'contexts/FeatureFlagContext';
import { t } from 'components/i18n';

export const CHECK_TYPE_OPTIONS = [
  {
    label: t(`check-type.http.title`, 'HTTP'),
    description: t(
      `check-type.http.desc`,
      'Measures a web endpoint for availability, response time, SSL certificate expiration and more.'
    ),
    value: CheckType.HTTP,
    group: CheckTypeGroup.ApiTest,
  },
  {
    label: t(`check-type.ping.title`, 'Ping'),
    description: t(`check-type.ping.desc`, 'Check a host for availability and response time.'),
    value: CheckType.PING,
    group: CheckTypeGroup.ApiTest,
  },
  {
    label: t(`check-type.grpc.title`, 'gRPC'),
    description: t(
      `check-type.grpc.desc`,
      'Use the gRPC Health Checking Protocol to ensure a gRPC service is healthy.'
    ),
    value: CheckType.GRPC,
    status: CheckStatus.EXPERIMENTAL,
    featureToggle: FeatureName.GRPCChecks,
    group: CheckTypeGroup.ApiTest,
  },
  {
    label: t(`check-type.dns.title`, 'DNS'),
    description: t(
      `check-type.dns.desc`,
      'Ensures a domain resolves and measures the average time for the resolution to happen.'
    ),
    value: CheckType.DNS,
    group: CheckTypeGroup.ApiTest,
  },
  {
    label: t(`check-type.tcp.title`, 'TCP'),
    description: t(`check-type.tcp.desc`, 'Ensures a hostname and port accept a connection and measures performance.'),
    value: CheckType.TCP,
    group: CheckTypeGroup.ApiTest,
  },
  {
    label: t(`check-type.traceroute.title`, 'Traceroute'),
    description: t(`check-type.traceroute.desc`, 'Trace the path of a request through the internet.'),
    value: CheckType.Traceroute,
    group: CheckTypeGroup.ApiTest,
  },
  {
    label: t(`check-type.multihttp.title`, 'MultiHTTP'),
    description: t(`check-type.multihttp.desc`, 'Check multiple web endpoints in sequence.'),
    value: CheckType.MULTI_HTTP,
    group: CheckTypeGroup.MultiStep,
  },
  {
    label: t(`check-type.scripted.title`, 'Scripted'),
    description: t(`check-type.scripted.desc`, 'Write a k6 script to run custom checks.'),
    value: CheckType.Scripted,
    status: CheckStatus.PUBLIC_PREVIEW,
    group: CheckTypeGroup.Scripted,
  },
  {
    label: t(`check-type.browser.title`, 'Browser'),
    description: t(`check-type.browser.desc`, 'Leverage k6 browser module to run checks in a browser.'),
    value: CheckType.Browser,
    status: CheckStatus.EXPERIMENTAL,
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
