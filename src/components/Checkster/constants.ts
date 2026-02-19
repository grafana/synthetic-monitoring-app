import { browserCheckSchema, MAX_TIMEOUT_BROWSER, MIN_TIMEOUT_BROWSER } from 'schemas/forms/BrowserCheckSchema';
import { dnsCheckSchema } from 'schemas/forms/DNSCheckSchema';
import { grpcCheckSchema } from 'schemas/forms/GRPCCheckSchema';
import { httpCheckSchema } from 'schemas/forms/HttpCheckSchema';
import {
  MAX_TIMEOUT_MULTI_HTTP,
  MIN_TIMEOUT_MULTI_HTTP,
  multiHttpCheckSchema,
} from 'schemas/forms/MultiHttpCheckSchema';
import { pingCheckSchema } from 'schemas/forms/PingCheckSchema';
import { MAX_TIMEOUT_SCRIPTED, MIN_TIMEOUT_SCRIPTED, scriptedCheckSchema } from 'schemas/forms/ScriptedCheckSchema';
import { tcpCheckSchema } from 'schemas/forms/TCPCheckSchema';
import {
  MAX_TIMEOUT_TRACEROUTE,
  MIN_TIMEOUT_TRACEROUTE,
  tracerouteCheckSchema,
} from 'schemas/forms/TracerouteCheckSchema';

import { CheckTypeGroupOption, CheckTypeOption, FormSectionName, FormSectionOrder, HTTPAuthType } from './types';
import {
  AlertSensitivity,
  BrowserCheck,
  Check,
  CheckStatus,
  CheckType,
  CheckTypeGroup,
  DNSCheck,
  DnsProtocol,
  DnsRecordType,
  DnsResponseCodes,
  FeatureName,
  GRPCCheck,
  HTTPCheck,
  HTTPCompressionAlgo,
  HttpMethod,
  HttpSslOption,
  HttpVersion,
  IpVersion,
  MultiHTTPCheck,
  PingCheck,
  ResponseMatchType,
  ScriptedCheck,
  TCPCheck,
  TracerouteCheck,
} from 'types';

import { MAX_BASE_TIMEOUT, MIN_BASE_TIMEOUT } from '../../schemas/general/Timeout';
import { ONE_MINUTE_IN_MS, THREE_SECONDS_IN_MS } from '../../utils.constants';
import { EXAMPLE_SCRIPT_BROWSER, EXAMPLE_SCRIPT_SCRIPTED } from '../constants';

/*
 * When adding a new check type or group, make sure to update:
 * - CHECK_TYPE_GROUP_MAP
 * - CHECK_TYPE_GROUP_OPTIONS_MAP (if adding new group)
 * - CHECK_TYPE_OPTION_MAP
 * - CHECK_CONFIG_MAP (if applicable)
 * - DEFAULT_CHECK_TYPE (if applicable)
 * - DEFAULT_CHECK_CONFIG_MAP (if applicable)
 */

// Note: check types and/or groups that are behind a feature flag should still be included here.
// The feature flag is checked when rendering the options in the UI.
// This map is used to determine the group for a given check type.
export const CHECK_TYPE_GROUP_MAP: Record<CheckTypeGroup, CheckType[]> = {
  [CheckTypeGroup.ApiTest]: [
    // Note: THe order of the check types in each group matters, as it determines the order in which they are displayed in the UI.
    CheckType.Http,
    CheckType.Ping,
    CheckType.Grpc,
    CheckType.Dns,
    CheckType.Tcp,
    CheckType.Traceroute,
  ],
  [CheckTypeGroup.MultiStep]: [CheckType.MultiHttp],
  [CheckTypeGroup.Scripted]: [CheckType.Scripted],
  [CheckTypeGroup.Browser]: [CheckType.Browser],
};

export const CHECK_TYPE_GROUP_OPTIONS_MAP: Record<CheckTypeGroup, CheckTypeGroupOption> = {
  [CheckTypeGroup.ApiTest]: {
    label: 'API Endpoint',
    description: 'Monitor service, website, or API availability and performance with different request types.',
    value: CheckTypeGroup.ApiTest,
    icon: `heart-rate`,
    protocols: CHECK_TYPE_GROUP_MAP[CheckTypeGroup.ApiTest],
  },
  [CheckTypeGroup.MultiStep]: {
    label: 'Multi Step',
    description: 'Run multiple requests in sequence, using the response data from one request to the next.',
    value: CheckTypeGroup.MultiStep,
    icon: `gf-interpolation-step-after`,
    protocols: CHECK_TYPE_GROUP_MAP[CheckTypeGroup.MultiStep],
  },
  [CheckTypeGroup.Scripted]: {
    label: 'Scripted',
    description: 'Write a custom script to run any number of requests with custom checks and assertions.',
    value: CheckTypeGroup.Scripted,
    icon: `k6`,
    protocols: CHECK_TYPE_GROUP_MAP[CheckTypeGroup.Scripted],
  },
  [CheckTypeGroup.Browser]: {
    label: `Browser`,
    description: `Monitor the availability and performance of a website using a real browser.`,
    value: CheckTypeGroup.Browser,
    icon: `globe`,
    protocols: CHECK_TYPE_GROUP_MAP[CheckTypeGroup.Browser],
  },
};

// Do not export, this is meant for internal use only
function getCheckTypeGroup(type: CheckType): CheckTypeGroup {
  const [group] = Object.entries(CHECK_TYPE_GROUP_MAP).find(([, types]) => types.includes(type)) ?? [];
  if (!group) {
    throw new TypeError(
      `Unable to determine group type for ${type}. See CHECK_TYPE_GROUP_MAP for configuration options.`
    );
  }

  return group as CheckTypeGroup;
}

export const CHECK_TYPE_OPTION_MAP: Record<CheckType, CheckTypeOption> = {
  [CheckType.Http]: {
    label: 'HTTP',
    value: CheckType.Http,
    description: 'Measures a web endpoint for availability, response time, SSL certificate expiration and more.',
    group: getCheckTypeGroup(CheckType.Http),
  },
  [CheckType.Ping]: {
    label: 'Ping',
    value: CheckType.Ping,
    description: 'Check a host for availability and response time.',
    group: getCheckTypeGroup(CheckType.Ping),
  },
  [CheckType.Grpc]: {
    label: 'gRPC',
    value: CheckType.Grpc,
    description: 'Use the gRPC Health Checking Protocol to ensure a gRPC service is healthy.',
    group: getCheckTypeGroup(CheckType.Grpc),
    status: {
      value: CheckStatus.Experimental,
      description: `gRPC checks are experimental. We're actively working on improving the experience and adding more features.`,
    },
    featureToggle: FeatureName.GRPCChecks,
  },
  [CheckType.Dns]: {
    label: 'DNS',
    value: CheckType.Dns,
    description: 'Ensures a domain resolves and measures the average time for the resolution to happen.',
    group: getCheckTypeGroup(CheckType.Dns),
  },
  [CheckType.Tcp]: {
    label: 'TCP',
    value: CheckType.Tcp,
    description: 'Ensures a hostname and port accept a connection and measures performance.',
    group: getCheckTypeGroup(CheckType.Tcp),
  },
  [CheckType.Traceroute]: {
    label: 'Traceroute',
    value: CheckType.Traceroute,
    description: 'Trace the path of a request through the internet.',
    group: getCheckTypeGroup(CheckType.Traceroute),
  },
  [CheckType.MultiHttp]: {
    label: 'MultiHttp',
    value: CheckType.MultiHttp,
    description: 'Check multiple web endpoints in sequence.',
    group: getCheckTypeGroup(CheckType.MultiHttp),
  },
  [CheckType.Scripted]: {
    label: 'Scripted',
    value: CheckType.Scripted,
    description: 'Write a k6 script to run custom checks.',
    group: getCheckTypeGroup(CheckType.Scripted),
  },
  [CheckType.Browser]: {
    label: 'Browser',
    value: CheckType.Browser,
    description: 'Leverage k6 browser module to run checks in a browser.',
    group: getCheckTypeGroup(CheckType.Browser),
  },
};

export const DEFAULT_CHECK_TYPE: CheckType = CheckType.Http;

const CHECK_BASE_CONFIG: Omit<Check, 'settings'> = {
  job: '',
  target: '',
  frequency: ONE_MINUTE_IN_MS,
  timeout: THREE_SECONDS_IN_MS,
  enabled: true,
  labels: [],
  probes: [],
  alertSensitivity: AlertSensitivity.None,
  basicMetricsOnly: true,
};

// Do not export, this is meant for internal use only
function mergeBaseConfig<TCheck extends Check>(
  checkType: keyof TCheck['settings'],
  settings: TCheck['settings'][keyof TCheck['settings']],
  override?: Partial<Omit<Check, 'settings'>>
): TCheck {
  return {
    ...CHECK_BASE_CONFIG,
    ...override,
    settings: {
      [checkType]: settings,
    },
  } as unknown as TCheck;
}

// Todo: this does not include ExistingObject
export const DEFAULT_CHECK_CONFIG_MAP: Record<CheckType, Check> = {
  [CheckType.Http]: mergeBaseConfig<HTTPCheck>(CheckType.Http, {
    method: HttpMethod.Get,
    ipVersion: IpVersion.V4,
    noFollowRedirects: false,
    compression: HTTPCompressionAlgo.None,
    failIfNotSSL: false,
    failIfSSL: false,
    failIfBodyMatchesRegexp: [],
    failIfBodyNotMatchesRegexp: [],
    failIfHeaderMatchesRegexp: [],
    failIfHeaderNotMatchesRegexp: [],
    headers: [],
    proxyConnectHeaders: [],
    validHTTPVersions: [],
    validStatusCodes: [],
  }),
  [CheckType.Ping]: mergeBaseConfig<PingCheck>(CheckType.Ping, {
    ipVersion: IpVersion.V4,
    dontFragment: false,
  }),
  [CheckType.Grpc]: mergeBaseConfig<GRPCCheck>(CheckType.Grpc, {
    ipVersion: IpVersion.V4,
    tls: false,
  }),
  [CheckType.Dns]: mergeBaseConfig<DNSCheck>(CheckType.Dns, {
    recordType: DnsRecordType.A,
    server: 'dns.google',
    ipVersion: IpVersion.V4,
    protocol: DnsProtocol.Udp,
    port: 53,
    validRCodes: [DnsResponseCodes.Noerror],
    validateAdditionalRRS: {
      failIfMatchesRegexp: [],
      failIfNotMatchesRegexp: [],
    },
    validateAnswerRRS: {
      failIfMatchesRegexp: [],
      failIfNotMatchesRegexp: [],
    },
    validateAuthorityRRS: {
      failIfMatchesRegexp: [],
      failIfNotMatchesRegexp: [],
    },
  }),
  [CheckType.Tcp]: mergeBaseConfig<TCPCheck>(CheckType.Tcp, {
    ipVersion: IpVersion.V4,
    tls: false,
    queryResponse: [],
  }),
  [CheckType.Traceroute]: mergeBaseConfig<TracerouteCheck>(
    CheckType.Traceroute,
    {
      maxHops: 64,
      maxUnknownHops: 15,
      ptrLookup: true,
      hopTimeout: 0,
    },
    {
      timeout: 30 * 1000,
      frequency: 2 * 60 * 1000,
    }
  ),
  [CheckType.MultiHttp]: mergeBaseConfig<MultiHTTPCheck>(
    CheckType.MultiHttp,
    {
      entries: [
        {
          request: {
            method: HttpMethod.Get,
            url: '',
            queryFields: [],
            headers: [],
          },
          checks: [],
        },
      ],
    },

    {
      frequency: 5 * 60 * 1000,
      timeout: 15 * 1000,
    }
  ),
  [CheckType.Scripted]: mergeBaseConfig<ScriptedCheck>(
    CheckType.Scripted,
    {
      script: EXAMPLE_SCRIPT_SCRIPTED,
    },
    {
      frequency: 5 * 60 * 1000,
      timeout: 15 * 1000,
    }
  ),
  [CheckType.Browser]: mergeBaseConfig<BrowserCheck>(
    CheckType.Browser,
    {
      script: EXAMPLE_SCRIPT_BROWSER,
    },
    {
      frequency: 5 * 60 * 1000,
      timeout: 60 * 1000,
    }
  ),
};

// Always keep in sync with DEFAULT_CHECK_TYPE
export const DEFAULT_CHECK_CONFIG = DEFAULT_CHECK_CONFIG_MAP[DEFAULT_CHECK_TYPE];

export const FORM_CHECK_TYPE_SCHEMA_MAP = {
  [CheckType.Browser]: browserCheckSchema,
  [CheckType.Dns]: dnsCheckSchema,
  [CheckType.Grpc]: grpcCheckSchema,
  [CheckType.Http]: httpCheckSchema,
  [CheckType.MultiHttp]: multiHttpCheckSchema,
  [CheckType.Ping]: pingCheckSchema,
  [CheckType.Scripted]: scriptedCheckSchema,
  [CheckType.Tcp]: tcpCheckSchema,
  [CheckType.Traceroute]: tracerouteCheckSchema,
};

// Use OVERRIDE_DEFAULT_SECTION_ORDER to override order for specific check types
export const DEFAULT_FORM_SECTION_ORDER: FormSectionOrder = [
  FormSectionName.Check,
  FormSectionName.Uptime,
  FormSectionName.Labels,
  FormSectionName.Execution,
  FormSectionName.Alerting,
];

export const OVERRIDE_DEFAULT_SECTION_ORDER: Partial<Record<CheckType, FormSectionOrder>> = {};

// Allowed HTTP methods for HTTP and MultiHTTP checks
// Note: Order matters, as it determines the order in which they are displayed in the UI.
export const ALLOWED_HTTP_REQUEST_METHODS: HttpMethod[] = [
  HttpMethod.Get,
  HttpMethod.Post,
  HttpMethod.Put,
  HttpMethod.Delete,
  HttpMethod.Head,
  HttpMethod.Patch, // new in synthetic-monitoring-agent@v0.43.0 (2025-09-16)
  HttpMethod.Options,
  // HttpMethod.TRACE, // supported by Agent
  // HttpMethod.CONNECT, // supported by Agent
];

export const IP_VERSION_OPTIONS = [
  { label: 'Any', value: IpVersion.Any },
  { label: 'IPv4', value: IpVersion.V4 },
  { label: 'IPv6', value: IpVersion.V6 },
];

export const HTTP_AUTH_TYPE_OPTIONS: Array<{ label: string; value: HTTPAuthType }> = [
  { label: 'None', value: HTTPAuthType.None },
  { label: 'Basic Auth', value: HTTPAuthType.BasicAuth }, // From 'Basic' to more explicit 'Basic Auth'
  { label: 'Bearer Token', value: HTTPAuthType.BearerToken }, // From 'Bearer' to more explicit 'Bearer Token'
];

export const VALID_HTTP_STATUS_CODE_OPTIONS = (function generateValidStatusCodes() {
  let validCodes = [];
  for (let i = 100; i <= 102; i++) {
    validCodes.push({
      label: `${i}`,
      value: i,
    });
  }
  for (let i = 200; i <= 208; i++) {
    validCodes.push({
      label: `${i}`,
      value: i,
    });
  }
  for (let i = 300; i <= 308; i++) {
    validCodes.push({
      label: `${i}`,
      value: i,
    });
  }
  for (let i = 400; i <= 418; i++) {
    validCodes.push({
      label: `${i}`,
      value: i,
    });
  }
  validCodes.push({
    label: '422',
    value: 422,
  });
  validCodes.push({
    label: '426',
    value: 426,
  });
  validCodes.push({
    label: '428',
    value: 428,
  });
  validCodes.push({
    label: '429',
    value: 429,
  });
  validCodes.push({
    label: '431',
    value: 431,
  });
  for (let i = 500; i <= 511; i++) {
    validCodes.push({
      label: `${i}`,
      value: i,
    });
  }
  validCodes.push({
    label: '598',
    value: 598,
  });
  validCodes.push({
    label: '599',
    value: 599,
  });
  return validCodes;
})();

export const VALID_HTTP_VERSION_OPTIONS = [
  {
    label: 'HTTP/1.0',
    value: HttpVersion.Http1_0,
  },
  {
    label: 'HTTP/1.1',
    value: HttpVersion.Http1_1,
  },
  {
    label: 'HTTP/2',
    value: HttpVersion.Http2_0,
  },
];

export const HTTP_SSL_OPTIONS = [
  {
    label: 'Ignore SSL',
    value: HttpSslOption.Ignore,
  },
  {
    label: 'Fail if SSL is present',
    value: HttpSslOption.FailIfPresent,
  },
  {
    label: 'Fail if SSL is not present',
    value: HttpSslOption.FailIfNotPresent,
  },
];

export const HTTP_COMPRESSION_ALGO_OPTIONS = [
  {
    label: 'None',
    value: HTTPCompressionAlgo.None,
  },
  {
    label: 'br',
    value: HTTPCompressionAlgo.Br,
  },
  {
    label: 'deflate',
    value: HTTPCompressionAlgo.Deflate,
  },
  {
    label: 'gzip',
    value: HTTPCompressionAlgo.Gzip,
  },
  {
    label: 'identity',
    value: HTTPCompressionAlgo.Identity,
  },
];

const BASE_TIMEOUT_MAP = {
  min: MIN_BASE_TIMEOUT,
  max: MAX_BASE_TIMEOUT,
};

export const CHECK_TYPE_TIMEOUT_MAP: Record<CheckType, { min: number; max: number }> = {
  [CheckType.Browser]: { min: MIN_TIMEOUT_BROWSER, max: MAX_TIMEOUT_BROWSER },
  [CheckType.Dns]: BASE_TIMEOUT_MAP,
  [CheckType.Grpc]: BASE_TIMEOUT_MAP,
  [CheckType.Http]: BASE_TIMEOUT_MAP,
  [CheckType.MultiHttp]: { min: MIN_TIMEOUT_MULTI_HTTP, max: MAX_TIMEOUT_MULTI_HTTP },
  [CheckType.Ping]: BASE_TIMEOUT_MAP,
  [CheckType.Scripted]: { min: MIN_TIMEOUT_SCRIPTED, max: MAX_TIMEOUT_SCRIPTED },
  [CheckType.Tcp]: BASE_TIMEOUT_MAP,
  [CheckType.Traceroute]: { min: MIN_TIMEOUT_TRACEROUTE, max: MAX_TIMEOUT_TRACEROUTE }, // fixed value (min === max)
};

export const DEFAULT_EXAMPLE_HOSTNAME = 'grafana.com';

export const DNS_RESPONSE_MATCH_OPTIONS = [
  { label: ResponseMatchType.Authority, value: ResponseMatchType.Authority },
  { label: ResponseMatchType.Answer, value: ResponseMatchType.Answer },
  { label: ResponseMatchType.Additional, value: ResponseMatchType.Additional },
];

// To override, change `navLabel` prob when rendering `<FormSection />`
export const FORM_NAVIGATION_SECTION_LABEL_MAP: Record<FormSectionName, string> = Object.entries(
  FormSectionName
).reduce<Record<FormSectionName, string>>((acc, [name, value]) => {
  if (value !== FormSectionName.Check) {
    acc[value] = name;
  }

  return acc;
}, {} as any); // Override check since it's only used internally

export const DEFAULT_MAX_ALLOWED_METRIC_LABELS = 10;
export const DEFAULT_MAX_ALLOWED_LOG_LABELS = 5;

// Checks that are executed with k6 rather than blackbox exporter
export const K6_CHECK_TYPES = [CheckType.MultiHttp, CheckType.Browser, CheckType.Scripted];

export const CHECK_TYPE_GROUP_DEFAULT_CHECK: Record<CheckTypeGroup, CheckType> = {
  [CheckTypeGroup.ApiTest]: CheckType.Http,
  [CheckTypeGroup.MultiStep]: CheckType.MultiHttp,
  [CheckTypeGroup.Browser]: CheckType.Browser,
  [CheckTypeGroup.Scripted]: CheckType.Scripted,
};

export const ASSISTED_FORM_MERGE_FIELDS = ['job', 'target', 'probes', 'frequency', 'labels', 'timeout'] as const;

// Css
export const CSS_PRIMARY_CONTAINER_NAME = 'checkEditor-primary-container';
export const FIELD_SPACING = 2;

export const SECONDARY_CONTAINER_ID = 'checkEditor-secondary-container';
