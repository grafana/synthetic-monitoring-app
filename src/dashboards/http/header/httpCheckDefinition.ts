import { CheckHeaderDefinitionModel, HeaderDefinitionFact } from 'dashboards/components/CheckDashboardHeader/CheckDashboardHeader.types';
import { HTTPCheck, HttpSettings, HttpVersion } from 'types';
import { formatDuration, getMethodColor } from 'utils';

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getRegexpRuleCount(http: HttpSettings) {
  return (
    (http.failIfBodyMatchesRegexp?.length ?? 0) +
    (http.failIfBodyNotMatchesRegexp?.length ?? 0) +
    (http.failIfHeaderMatchesRegexp?.length ?? 0) +
    (http.failIfHeaderNotMatchesRegexp?.length ?? 0)
  );
}

function hasCustomHttpVersions(versions: HttpVersion[] | undefined) {
  if (!versions?.length) {
    return false;
  }

  return !(
    versions.length === 2 && versions.includes(HttpVersion.Http1_1) && versions.includes(HttpVersion.Http2_0)
  );
}

function formatHttpUptimeRules(http: HttpSettings) {
  const summary = [
    http.validStatusCodes?.length ? http.validStatusCodes.join(', ') : '2xx',
    hasCustomHttpVersions(http.validHTTPVersions) ? http.validHTTPVersions?.join(', ') : undefined,
    http.failIfNotSSL ? 'SSL required' : undefined,
    http.failIfSSL ? 'SSL prohibited' : undefined,
    getRegexpRuleCount(http) > 0 ? pluralize(getRegexpRuleCount(http), 'regexp rule') : undefined,
  ].filter((value): value is string => Boolean(value));

  return summary.join(' · ');
}

function getHttpDefinitionDetails(http: HttpSettings): HeaderDefinitionFact[] {
  const details: Array<HeaderDefinitionFact | undefined> = [
    http.headers?.length
      ? { id: 'request-headers', label: 'Request headers', value: `${http.headers.length} configured` }
      : undefined,
    http.body ? { id: 'body', label: 'Request body', value: 'Configured' } : undefined,
    { id: 'redirects', label: 'Redirects', value: http.noFollowRedirects ? 'Do not follow' : 'Follow' },
    { id: 'ip-version', label: 'IP version', value: http.ipVersion },
    http.compression ? { id: 'compression', label: 'Compression', value: http.compression } : undefined,
    http.basicAuth || http.bearerToken
      ? { id: 'authentication', label: 'Authentication', value: 'Configured' }
      : undefined,
    http.proxyURL ? { id: 'proxy', label: 'Proxy', value: 'Configured' } : undefined,
    http.tlsConfig ? { id: 'tls', label: 'TLS configuration', value: 'Configured' } : undefined,
    http.cacheBustingQueryParamName
      ? { id: 'cache-busting', label: 'Cache busting', value: 'Configured' }
      : undefined,
    getRegexpRuleCount(http) > 0
      ? { id: 'regexp-validations', label: 'Response validations', value: pluralize(getRegexpRuleCount(http), 'rule') }
      : undefined,
  ];

  return details.filter((detail): detail is HeaderDefinitionFact => Boolean(detail));
}

export function formatHttpCheckDefinition(check: HTTPCheck): CheckHeaderDefinitionModel {
  const http = check.settings.http;

  return {
    title: check.job,
    typeLabel: 'HTTP',
    qualifier: {
      text: http.method,
      getColor: (theme) => getMethodColor(theme, http.method),
    },
    target: {
      value: check.target,
      accessibleLabel: 'Target URL',
    },
    facts: [
      {
        id: 'frequency',
        label: 'Frequency',
        value: formatDuration(check.frequency, true),
        icon: 'clock-nine',
      },
      {
        id: 'configured-probes',
        label: 'Probes',
        value: String(check.probes.length),
        icon: 'globe',
      },
      { id: 'timeout', label: 'Timeout', value: formatDuration(check.timeout, true), icon: 'hourglass' },
      { id: 'uptime-rules', label: 'Uptime success', value: formatHttpUptimeRules(http), icon: 'shield' },
    ],
    labels: check.labels,
    details: {
      title: 'HTTP check definition',
      items: getHttpDefinitionDetails(http),
    },
  };
}
