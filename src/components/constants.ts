import { SelectableValue } from '@grafana/data';

import {
  AlertFamily,
  AlertSensitivity,
  AlertSeverity,
  Check,
  CheckEnabledStatus,
  CheckListViewType,
  CheckSort,
  CheckType,
  DNSCheck,
  DnsProtocol,
  DnsRecordType,
  DnsResponseCodes,
  GRPCCheck,
  HTTPCheck,
  HTTPCompressionAlgo,
  HttpMethod,
  HttpRegexValidationType,
  HttpSslOption,
  IpVersion,
  MultiHttpAssertionType,
  MultiHTTPCheck,
  MultiHttpVariableType,
  PingCheck,
  ResponseMatchType,
  ScriptedCheck,
  TCPCheck,
  TimeUnits,
  TracerouteCheck,
} from 'types';

import { enumToStringArray } from '../utils';
import { AssertionConditionVariant, AssertionSubjectVariant } from './MultiHttp/MultiHttpTypes';

export const DNS_RESPONSE_CODES = enumToStringArray(DnsResponseCodes).map((responseCode) => ({
  label: responseCode,
  value: responseCode,
}));

export const DNS_RESPONSE_MATCH_OPTIONS = [
  { label: `Fail if ${ResponseMatchType.Authority} matches`, value: ResponseMatchType.Authority },
  { label: `Fail if ${ResponseMatchType.Answer} matches`, value: ResponseMatchType.Answer },
  { label: `Fail if ${ResponseMatchType.Additional} matches`, value: ResponseMatchType.Additional },
];

export const DNS_RECORD_TYPES = [
  {
    label: DnsRecordType.A,
    value: DnsRecordType.A,
  },
  {
    label: DnsRecordType.AAAA,
    value: DnsRecordType.AAAA,
  },
  {
    label: DnsRecordType.CNAME,
    value: DnsRecordType.CNAME,
  },
  {
    label: DnsRecordType.MX,
    value: DnsRecordType.MX,
  },
  {
    label: DnsRecordType.NS,
    value: DnsRecordType.NS,
  },
  {
    label: DnsRecordType.SOA,
    value: DnsRecordType.SOA,
  },
  {
    label: DnsRecordType.TXT,
    value: DnsRecordType.TXT,
  },
  {
    label: DnsRecordType.PTR,
    value: DnsRecordType.PTR,
  },
  {
    label: DnsRecordType.SRV,
    value: DnsRecordType.SRV,
  },
];

export const DNS_PROTOCOLS = [
  {
    label: DnsProtocol.UDP,
    value: DnsProtocol.UDP,
  },
  {
    label: DnsProtocol.TCP,
    value: DnsProtocol.TCP,
  },
];

export const IP_OPTIONS = [
  {
    label: 'Any',
    value: IpVersion.Any,
  },
  {
    label: 'V4',
    value: IpVersion.V4,
  },
  {
    label: 'V6',
    value: IpVersion.V6,
  },
];

export const HTTP_SSL_OPTIONS = [
  {
    label: 'Ignore SSL',
    value: HttpSslOption.Ignore,
  },
  {
    label: 'Probe fails if SSL is present',
    value: HttpSslOption.FailIfPresent,
  },
  {
    label: 'Probe fails if SSL is not present',
    value: HttpSslOption.FailIfNotPresent,
  },
];

export const HTTP_REGEX_VALIDATION_OPTIONS = [
  { label: 'Check fails if response header matches', value: HttpRegexValidationType.Header },
  { label: 'Check fails if response body matches', value: HttpRegexValidationType.Body },
];

export const TIME_UNIT_OPTIONS = [
  {
    label: 'seconds',
    value: TimeUnits.Seconds,
  },

  {
    label: 'minutes',
    value: TimeUnits.Minutes,
  },

  {
    label: 'hours',
    value: TimeUnits.Hours,
  },
];

export const TEN_MINUTES_IN_MS = 1000 * 60 * 10;
export const FIVE_MINUTES_IN_MS = 1000 * 60 * 5;

export const FALLBACK_CHECK_BASE: Omit<Check, 'settings'> = {
  job: '',
  target: '',
  frequency: 60000,
  timeout: 3000,
  enabled: true,
  labels: [],
  probes: [],
  alertSensitivity: AlertSensitivity.None,
  basicMetricsOnly: true,
};

export const FALLBACK_CHECK_DNS: DNSCheck = {
  ...FALLBACK_CHECK_BASE,
  settings: {
    dns: {
      recordType: DnsRecordType.A,
      server: 'dns.google',
      ipVersion: IpVersion.V4,
      protocol: DnsProtocol.UDP,
      port: 53,
      validRCodes: [DnsResponseCodes.NOERROR],
    },
  },
};

export const FALLBACK_CHECK_GRPC: GRPCCheck = {
  ...FALLBACK_CHECK_BASE,
  settings: {
    grpc: {
      ipVersion: IpVersion.V4,
      tls: false,
    },
  },
};

export const FALLBACK_CHECK_HTTP: HTTPCheck = {
  ...FALLBACK_CHECK_BASE,
  settings: {
    http: {
      method: HttpMethod.GET,
      ipVersion: IpVersion.V4,
      noFollowRedirects: false,
      compression: HTTPCompressionAlgo.none,
    },
  },
};

export const FALLBACK_CHECK_MULTIHTTP: MultiHTTPCheck = {
  ...FALLBACK_CHECK_BASE,
  frequency: FIVE_MINUTES_IN_MS,
  timeout: 15000,
  settings: {
    multihttp: {
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
  },
};

export const FALLBACK_CHECK_PING: PingCheck = {
  ...FALLBACK_CHECK_BASE,
  settings: {
    ping: {
      ipVersion: IpVersion.V4,
      dontFragment: false,
    },
  },
};

export const FALLBACK_CHECK_SCRIPTED: ScriptedCheck = {
  ...FALLBACK_CHECK_BASE,
  frequency: FIVE_MINUTES_IN_MS,
  timeout: 15000,
  settings: {
    scripted: {
      script: btoa(`import { check } from 'k6'
import http from 'k6/http'

export default function main() {
  const res = http.get('http://test.k6.io/');
  // console.log will be represented as logs in Loki
  console.log('got a response')
  check(res, {
    'is status 200': (r) => r.status === 200,
  });
}`),
    },
  },
};

export const FALLBACK_CHECK_TCP: TCPCheck = {
  ...FALLBACK_CHECK_BASE,
  settings: {
    tcp: {
      ipVersion: IpVersion.V4,
      tls: false,
      queryResponse: [],
    },
  },
};

export const FALLBACK_CHECK_TRACEROUTE: TracerouteCheck = {
  ...FALLBACK_CHECK_BASE,
  timeout: 30000,
  frequency: 120000,
  settings: {
    traceroute: {
      maxHops: 64,
      maxUnknownHops: 15,
      ptrLookup: true,
      hopTimeout: 0,
    },
  },
};

export const fallbackCheckMap = {
  [CheckType.DNS]: FALLBACK_CHECK_DNS,
  [CheckType.GRPC]: FALLBACK_CHECK_GRPC,
  [CheckType.HTTP]: FALLBACK_CHECK_HTTP,
  [CheckType.MULTI_HTTP]: FALLBACK_CHECK_MULTIHTTP,
  [CheckType.PING]: FALLBACK_CHECK_PING,
  [CheckType.Scripted]: FALLBACK_CHECK_SCRIPTED,
  [CheckType.TCP]: FALLBACK_CHECK_TCP,
  [CheckType.Traceroute]: FALLBACK_CHECK_TRACEROUTE,
};

export const colors = {
  darkThemeBlueBackground: '#021B39',
  darkThemeBorderBlue: '#6394EB',
  lightThemeBlueBackground: '#E9F4FF',
  lightThemeBorderBlue: '#84AFF1',
  darkText: '#9FA7B3',
  lightText: '#464C54',
  black: '#0B0C0E',
  grey: '#F7F8FA',
};

export const LEGACY_METRICS_DS_NAME = 'Synthetic Monitoring Metrics';
export const LEGACY_LOGS_DS_NAME = 'Synthetic Monitoring Logs';
export const SM_ALERTING_NAMESPACE = 'synthetic_monitoring';
export const ALERTING_SEVERITY_OPTIONS = [
  {
    label: 'Critical',
    value: AlertSeverity.Critical,
  },
  {
    label: 'Warning',
    value: AlertSeverity.Warn,
  },
  {
    label: 'Error',
    value: AlertSeverity.Error,
  },
  {
    label: 'Info',
    value: AlertSeverity.Info,
  },
];

export const ALERT_SENSITIVITY_OPTIONS = [
  { label: 'None', value: AlertSensitivity.None },
  { label: 'Low', value: AlertSensitivity.Low },
  { label: 'Medium', value: AlertSensitivity.Medium },
  { label: 'High', value: AlertSensitivity.High },
];

export const DEFAULT_ALERT_NAMES_BY_FAMILY_AND_SENSITIVITY = {
  [AlertFamily.ProbeSuccess]: {
    [AlertSensitivity.Low]: 'SyntheticMonitoringCheckFailureAtLowSensitivity',
    [AlertSensitivity.Medium]: 'SyntheticMonitoringCheckFailureAtMediumSensitivity',
    [AlertSensitivity.High]: 'SyntheticMonitoringCheckFailureAtHighSensitivity',
  },
};

export const ALERT_RULE_EXPR_REGEX =
  /^(?<metric>[A-Za-z0-9:_]+)\{alert_sensitivity="(?<sensitivity>[^"]+)"\}(?:\s*\*\s*\d+)?\s*(?<operator><|<=|==|>|>=)\s*(?<threshold>[+-]?\d+(?:\.\d+)?)$/;

export const ALERT_PROBE_SUCCESS_RECORDING_METRIC = 'instance_job_severity:probe_success:mean5m';

export const ALERT_PROBE_SUCCESS_RECORDING_EXPR = `(sum without(probe, config_version) (rate(probe_all_success_sum[5m]) *
on(instance, job, probe) group_left(alert_sensitivity) max by(instance, job,
probe, alert_sensitivity) (sm_check_info{alert_sensitivity!=""})) / sum
without(probe, config_version) (rate(probe_all_success_count[5m]) *
on(instance, job, probe) group_left(alert_sensitivity) max by(instance, job,
probe, alert_sensitivity) (sm_check_info{alert_sensitivity!=""}))) * 100`;

export const DEFAULT_ALERT_LABELS = {
  namespace: 'synthetic_monitoring',
};

export const getDefaultAlertAnnotations = (percentage: number) => ({
  description: `check job {{ $labels.job }} instance {{ $labels.instance }} has a success rate of {{ printf "%.1f" $value }}%.`,
  summary: `check success below ${percentage}%`,
});

export const CHECK_LIST_SORT_OPTIONS = [
  {
    label: 'A-Z',
    value: CheckSort.AToZ,
  },
  {
    label: 'Z-A',
    value: CheckSort.ZToA,
  },
  {
    label: 'Asc. Reachability ',
    value: CheckSort.ReachabilityAsc,
  },
  {
    label: 'Desc. Reachability ',
    value: CheckSort.ReachabilityDesc,
  },
  {
    label: 'Asc. Executions ',
    value: CheckSort.ExecutionsAsc,
  },
  {
    label: 'Desc. Executions ',
    value: CheckSort.ExecutionsDesc,
  },
];

export const CHECK_LIST_STATUS_OPTIONS: Array<SelectableValue<CheckEnabledStatus>> = [
  { label: 'All', value: CheckEnabledStatus.All },
  { label: 'Enabled', value: CheckEnabledStatus.Enabled },
  { label: 'Disabled', value: CheckEnabledStatus.Disabled },
];

export const CHECK_LIST_VIEW_TYPE_OPTIONS = [
  { description: 'Card view', value: CheckListViewType.Card, icon: 'check-square' },
  { description: 'List view', value: CheckListViewType.List, icon: 'list-ul' },
  { description: 'Visualization view', value: CheckListViewType.Viz, icon: 'gf-grid' },
];

export const CHECKS_PER_PAGE_CARD = 15;
export const CHECKS_PER_PAGE_LIST = 50;

export const CHECK_LIST_VIEW_TYPE_LS_KEY = 'grafana.sm.checklist.viewType';

export const CHECK_LIST_ICON_OVERLAY_LS_KEY = 'grafana.sm.checklist.iconOverlay';

export const HTTP_COMPRESSION_ALGO_OPTIONS = [
  { label: 'none', value: HTTPCompressionAlgo.none },
  { label: 'identity', value: HTTPCompressionAlgo.identity },
  { label: 'br', value: HTTPCompressionAlgo.br },
  { label: 'gzip', value: HTTPCompressionAlgo.gzip },
  { label: 'deflate', value: HTTPCompressionAlgo.deflate },
];

export const PLUGIN_URL_PATH = '/a/grafana-synthetic-monitoring-app/';

export const METHOD_OPTIONS = [
  {
    label: 'GET',
    value: HttpMethod.GET,
  },
  {
    label: 'HEAD',
    value: HttpMethod.HEAD,
  },
  {
    label: 'PUT',
    value: HttpMethod.PUT,
  },
  {
    label: 'POST',
    value: HttpMethod.POST,
  },
  {
    label: 'DELETE',
    value: HttpMethod.DELETE,
  },
  {
    label: 'OPTIONS',
    value: HttpMethod.OPTIONS,
  },
];

export const headerNameOptions = [
  { label: 'Accept', value: 'Accept' },
  { label: 'Accept-Charset', value: 'Accept-Charset' },
  { label: 'Authorization', value: 'Authorization' },
  { label: 'Cache-Control', value: 'Cache-Control' },
  { label: 'Content-Type', value: 'Content-Type' },
];

export const MULTI_HTTP_VARIABLE_TYPE_OPTIONS = [
  { label: 'JSON Path', value: MultiHttpVariableType.JSON_PATH },
  { label: 'Regular Expression', value: MultiHttpVariableType.REGEX },
  { label: 'CSS Selector', value: MultiHttpVariableType.CSS_SELECTOR },
];

export const MULTI_HTTP_ASSERTION_TYPE_OPTIONS = [
  { label: 'Text', value: MultiHttpAssertionType.Text },
  { label: 'JSON path value', value: MultiHttpAssertionType.JSONPathValue },
  { label: 'JSON path', value: MultiHttpAssertionType.JSONPath },
  { label: 'Regex', value: MultiHttpAssertionType.Regex },
];

export const ASSERTION_CONDITION_OPTIONS: Array<SelectableValue<AssertionConditionVariant>> = [
  { label: 'Contains', value: AssertionConditionVariant.Contains },
  { label: 'Does not contain', value: AssertionConditionVariant.NotContains },
  { label: 'Equals', value: AssertionConditionVariant.Equals },
  { label: 'Starts with', value: AssertionConditionVariant.StartsWith },
  { label: 'Ends with', value: AssertionConditionVariant.EndsWith },
];

export const ASSERTION_SUBJECT_OPTIONS: Array<SelectableValue<AssertionSubjectVariant>> = [
  { label: 'Body', value: AssertionSubjectVariant.ResponseBody },
  { label: 'Headers', value: AssertionSubjectVariant.ResponseHeaders },
  { label: 'HTTP status code', value: AssertionSubjectVariant.HttpStatusCode },
];

export const UPTIME_DESCRIPTION =
  'Whether any of the probes could reach the target. Uptime decreases when all the probes fail simultaneously.';
export const REACHABILITY_DESCRIPTION =
  'The success rate of all the probes. Reachability decreases when any probe fails.';
export const LATENCY_DESCRIPTION =
  'The average time to receive an answer across all the checks during the whole time period.';

export const STANDARD_REFRESH_INTERVAL = 1000 * 60;

export const CHECK_FORM_ERROR_EVENT = `sm-form-error`;
