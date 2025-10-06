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
    CheckType.HTTP,
    CheckType.PING,
    CheckType.GRPC,
    CheckType.DNS,
    CheckType.TCP,
    CheckType.Traceroute,
  ],
  [CheckTypeGroup.MultiStep]: [CheckType.MULTI_HTTP],
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

// This decides the order of the groups when rendering
// @ts-expect-error unused for now TODO: remove if not needed
const CHECK_TYPE_GROUP_OPTIONS: CheckTypeGroupOption[] = [
  CheckTypeGroup.ApiTest,
  CheckTypeGroup.MultiStep,
  CheckTypeGroup.Scripted,
  CheckTypeGroup.Browser,
].map((checkTypeGroup) => CHECK_TYPE_GROUP_OPTIONS_MAP[checkTypeGroup]);

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
  [CheckType.HTTP]: {
    label: 'HTTP',
    value: CheckType.HTTP,
    description: 'Measures a web endpoint for availability, response time, SSL certificate expiration and more.',
    group: getCheckTypeGroup(CheckType.HTTP),
  },
  [CheckType.PING]: {
    label: 'Ping',
    value: CheckType.PING,
    description: 'Check a host for availability and response time.',
    group: getCheckTypeGroup(CheckType.PING),
  },
  [CheckType.GRPC]: {
    label: 'gRPC',
    value: CheckType.GRPC,
    description: 'Use the gRPC Health Checking Protocol to ensure a gRPC service is healthy.',
    group: getCheckTypeGroup(CheckType.GRPC),
    status: {
      value: CheckStatus.EXPERIMENTAL,
      description: `gRPC checks are experimental. We're actively working on improving the experience and adding more features.`,
    },
    featureToggle: FeatureName.GRPCChecks,
  },
  [CheckType.DNS]: {
    label: 'DNS',
    value: CheckType.DNS,
    description: 'Ensures a domain resolves and measures the average time for the resolution to happen.',
    group: getCheckTypeGroup(CheckType.DNS),
  },
  [CheckType.TCP]: {
    label: 'TCP',
    value: CheckType.TCP,
    description: 'Ensures a hostname and port accept a connection and measures performance.',
    group: getCheckTypeGroup(CheckType.TCP),
  },
  [CheckType.Traceroute]: {
    label: 'Traceroute',
    value: CheckType.Traceroute,
    description: 'Trace the path of a request through the internet.',
    group: getCheckTypeGroup(CheckType.Traceroute),
  },
  [CheckType.MULTI_HTTP]: {
    label: 'MultiHttp',
    value: CheckType.MULTI_HTTP,
    description: 'Check multiple web endpoints in sequence.',
    group: getCheckTypeGroup(CheckType.MULTI_HTTP),
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

const DEFAULT_K6_SCRIPT = btoa(`import { check, fail } from 'k6'
import http from 'k6/http'

export default function main() {
  const result = http.get('http://test.k6.io/');

  // console.log will be represented as logs in Loki
  console.log('got a response');
  
  // Use check() to test conditions. These show as 'assertions' in the dashboard
  // Note: failed check() calls do not impact uptime and reachability
  const pass = check(result, {
    'is status 200': (r) => r.status === 200,
  });

  // Use fail() to abort and fail a test, impacting uptime and reachability
  if(!pass){
    fail(\`non 200 result \${result.status}\`);
  }
}`);

const DEFAULT_K6_BROWSER_SCRIPT = btoa(`import { browser } from 'k6/browser';
import { check } from 'https://jslib.k6.io/k6-utils/1.5.0/index.js';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
  },
};

export default async function () {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto("https://test.k6.io/my_messages.php");

    await page.locator('input[name="login"]').type("admin");
    await page.locator('input[name="password"]').type("123");

    await Promise.all([
      page.waitForNavigation(),
      page.locator('input[type="submit"]').click(),
    ]);

    await check(page.locator("h2"), {
      header: async (locator) => (await locator.textContent()) == "Welcome, admin!",
    });
  } catch (e) {
    console.log('Error during execution:', e);
    throw e;
  } finally {
    await page.close();
  }
}`);

export const DEFAULT_CHECK_TYPE: CheckType = CheckType.HTTP;
// Don't set manually, derive from DEFAULT_CHECK_TYPE
export const DEFAULT_CHECK_TYPE_GROUP: CheckTypeGroup = CHECK_TYPE_OPTION_MAP[DEFAULT_CHECK_TYPE].group;

const CHECK_BASE_CONFIG: Omit<Check, 'settings'> = {
  job: '',
  target: '',
  frequency: 60 * 1000,
  timeout: 3 * 1000,
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
  [CheckType.HTTP]: mergeBaseConfig<HTTPCheck>(CheckType.HTTP, {
    method: HttpMethod.GET,
    ipVersion: IpVersion.V4,
    noFollowRedirects: false,
    compression: HTTPCompressionAlgo.none,
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
  [CheckType.PING]: mergeBaseConfig<PingCheck>(CheckType.PING, {
    ipVersion: IpVersion.V4,
    dontFragment: false,
  }),
  [CheckType.GRPC]: mergeBaseConfig<GRPCCheck>(CheckType.GRPC, {
    ipVersion: IpVersion.V4,
    tls: false,
  }),
  [CheckType.DNS]: mergeBaseConfig<DNSCheck>(CheckType.DNS, {
    recordType: DnsRecordType.A,
    server: 'dns.google',
    ipVersion: IpVersion.V4,
    protocol: DnsProtocol.UDP,
    port: 53,
    validRCodes: [DnsResponseCodes.NOERROR],
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
  [CheckType.TCP]: mergeBaseConfig<TCPCheck>(CheckType.TCP, {
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
  [CheckType.MULTI_HTTP]: mergeBaseConfig<MultiHTTPCheck>(
    CheckType.MULTI_HTTP,
    {
      entries: [
        {
          request: {
            method: HttpMethod.GET,
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
      script: DEFAULT_K6_SCRIPT,
    },
    {
      frequency: 5 * 60 * 1000,
      timeout: 15 * 1000,
    }
  ),
  [CheckType.Browser]: mergeBaseConfig<BrowserCheck>(
    CheckType.Browser,
    {
      script: DEFAULT_K6_BROWSER_SCRIPT,
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
  [CheckType.DNS]: dnsCheckSchema,
  [CheckType.GRPC]: grpcCheckSchema,
  [CheckType.HTTP]: httpCheckSchema,
  [CheckType.MULTI_HTTP]: multiHttpCheckSchema,
  [CheckType.PING]: pingCheckSchema,
  [CheckType.Scripted]: scriptedCheckSchema,
  [CheckType.TCP]: tcpCheckSchema,
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

export const DEFAULT_HTTP_COMPRESSION_ALGO = HTTPCompressionAlgo.none;

// Allowed HTTP methods for HTTP and MultiHTTP checks
// Note: Order matters, as it determines the order in which they are displayed in the UI.
export const ALLOWED_HTTP_REQUEST_METHODS: HttpMethod[] = [
  HttpMethod.GET,
  HttpMethod.POST,
  HttpMethod.PUT,
  HttpMethod.DELETE,
  HttpMethod.HEAD,
  HttpMethod.PATCH, // new in synthetic-monitoring-agent@v0.43.0 (2025-09-16)
  HttpMethod.OPTIONS,
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
    value: HttpVersion.HTTP1_0,
  },
  {
    label: 'HTTP/1.1',
    value: HttpVersion.HTTP1_1,
  },
  {
    label: 'HTTP/2',
    value: HttpVersion.HTTP2_0,
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
    value: HTTPCompressionAlgo.none,
  },
  {
    label: 'br',
    value: HTTPCompressionAlgo.br,
  },
  {
    label: 'deflate',
    value: HTTPCompressionAlgo.deflate,
  },
  {
    label: 'gzip',
    value: HTTPCompressionAlgo.gzip,
  },
  {
    label: 'identity',
    value: HTTPCompressionAlgo.identity,
  },
];

const baseTimeoutMap = {
  min: MIN_BASE_TIMEOUT,
  max: MAX_BASE_TIMEOUT,
};

export const CHECK_TYPE_TIMEOUT_MAP: Record<CheckType, { min: number; max: number }> = {
  [CheckType.Browser]: { min: MIN_TIMEOUT_BROWSER, max: MAX_TIMEOUT_BROWSER },
  [CheckType.DNS]: baseTimeoutMap,
  [CheckType.GRPC]: baseTimeoutMap,
  [CheckType.HTTP]: baseTimeoutMap,
  [CheckType.MULTI_HTTP]: { min: MIN_TIMEOUT_MULTI_HTTP, max: MAX_TIMEOUT_MULTI_HTTP },
  [CheckType.PING]: baseTimeoutMap,
  [CheckType.Scripted]: { min: MIN_TIMEOUT_SCRIPTED, max: MAX_TIMEOUT_SCRIPTED },
  [CheckType.TCP]: baseTimeoutMap,
  [CheckType.Traceroute]: { min: MIN_TIMEOUT_TRACEROUTE, max: MAX_TIMEOUT_TRACEROUTE }, // fixed value (min === max)
};

export const DEFAULT_EXAMPLE_HOSTNAME = 'grafana.com';

export const DNS_RESPONSE_MATCH_OPTIONS = [
  { label: ResponseMatchType.Authority, value: ResponseMatchType.Authority },
  { label: ResponseMatchType.Answer, value: ResponseMatchType.Answer },
  { label: ResponseMatchType.Additional, value: ResponseMatchType.Additional },
];

export const FORM_NAVIGATION_SECTION_LABEL_MAP: Record<FormSectionName, string> = Object.entries(
  FormSectionName
).reduce<Record<FormSectionName, string>>(
  (acc, [name, value]) => {
    if (value !== FormSectionName.Check) {
      acc[value] = name;
    }

    return acc;
  },
  { [FormSectionName.Check]: 'Request' } as any
); // Override check since it's only used internally

/**
 * Because we have separated "multi-http" assertions, we need a
 * way to say that regardless of the entry's index, this error
 * belongs to the steps section or the uptime definition step.
 *
 * We have to wildcard the entry index in form errors.
 *
 * `-1` works well because it is type safe as it is a number, but
 * it is also impossible to be a valid index
 */
export const ENTRY_INDEX_CHAR = `-1`;

// Checks that are executed with k6 rather than blackbox exporter
export const K6_CHECK_TYPES = [CheckType.MULTI_HTTP, CheckType.Browser, CheckType.Scripted];

// Css
export const CSS_PRIMARY_CONTAINER_NAME = 'checkEditor-primary-container';
export const FIELD_SPACING = 2;
