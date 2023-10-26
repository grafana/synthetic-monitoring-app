import { enumToStringArray } from '../utils';
import {
  DnsResponseCodes,
  DnsRecordType,
  DnsProtocol,
  IpVersion,
  CheckType,
  HttpSslOption,
  HttpRegexValidationType,
  Check,
  TimeUnits,
  AlertFamily,
  AlertSeverity,
  AlertSensitivity,
  CheckSort,
  CheckEnabledStatus,
  CheckListViewType,
  HTTPCompressionAlgo,
  ResponseMatchType,
  Settings,
  HttpMethod,
  MultiHttpVariableType,
  MultiHttpAssertionType,
} from 'types';
import { AssertionConditionVariant, AssertionSubjectVariant } from './MultiHttp/MultiHttpTypes';
import { SelectableValue } from '@grafana/data';

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

export const CHECK_FILTER_OPTIONS = [
  {
    label: 'All',
    value: 'all',
  },
  {
    label: 'HTTP',
    value: CheckType.HTTP,
  },
  {
    label: 'MULTIHTTP',
    value: CheckType.MULTI_HTTP,
  },
  {
    label: 'PING',
    value: CheckType.PING,
  },
  {
    label: 'DNS',
    value: CheckType.DNS,
  },
  {
    label: 'TCP',
    value: CheckType.TCP,
  },
  {
    label: 'Traceroute',
    value: CheckType.Traceroute,
  },
];

export const CHECK_TYPE_OPTIONS = [
  {
    label: 'HTTP',
    value: CheckType.HTTP,
    description: 'Measures a web endpoint for availability, response time, SSL certificate expiration and more.',
  },
  {
    label: 'MULTIHTTP',
    value: CheckType.MULTI_HTTP,
    description: 'Check multiple web endpoints in sequence',
  },
  {
    label: 'PING',
    value: CheckType.PING,
    description: 'Check a host for availability and response time.',
  },
  {
    label: 'DNS',
    value: CheckType.DNS,
    description: 'Ensures a domain resolves and measures the average time for the resolution to happen',
  },
  {
    label: 'TCP',
    value: CheckType.TCP,
    description: 'Ensures a hostname and port accept a connection and measures performance',
  },
  {
    label: 'Traceroute',
    value: CheckType.Traceroute,
    description: 'Trace the path of a request through the internet',
  },
];

export const HTTP_SSL_OPTIONS = [
  {
    label: 'Ignore SSL',
    value: HttpSslOption.Ignore,
  },
  {
    label: 'Probe fails if SSL is present.',
    value: HttpSslOption.FailIfPresent,
  },
  {
    label: 'Probe fails if SSL is not present.',
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

export const fallbackCheck = (checkType: CheckType) => {
  const fallbackTypeBasedOnCheck = checkType ? fallbackType[checkType] : CheckType.HTTP;
  return {
    job: '',
    target: '',
    frequency: 60000,
    timeout: 3000,
    enabled: true,
    labels: [],
    probes: [],
    alertSensitivity: AlertSensitivity.None,
    settings: {
      [checkType]: fallbackTypeBasedOnCheck,
    },
    basicMetricsOnly: true,
  } as Check;
};

const fallbackType = {
  http: fallbackSettings(CheckType.HTTP),
  tcp: fallbackSettings(CheckType.TCP),
  dns: fallbackSettings(CheckType.DNS),
  ping: fallbackSettings(CheckType.PING),
  traceroute: fallbackSettings(CheckType.Traceroute),
  multihttp: fallbackSettings(CheckType.MULTI_HTTP),
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
    label: 'Success',
    value: CheckSort.SuccessRate,
  },
];

export const CHECK_LIST_STATUS_OPTIONS = [
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

export const PEM_HEADER = '-----BEGIN CERTIFICATE-----';

export const PEM_FOOTER = '-----END CERTIFICATE-----';

export const CHECK_LIST_VIEW_TYPE_LS_KEY = 'grafana.sm.checklist.viewType';

export const CHECK_LIST_ICON_OVERLAY_LS_KEY = 'grafana.sm.checklist.iconOverlay';

export const INVALID_WEB_URL_MESSAGE = 'Target must be a valid web URL';

export const HTTP_COMPRESSION_ALGO_OPTIONS = [
  { label: 'none', value: HTTPCompressionAlgo.none },
  { label: 'identity', value: HTTPCompressionAlgo.identity },
  { label: 'br', value: HTTPCompressionAlgo.br },
  { label: 'gzip', value: HTTPCompressionAlgo.gzip },
  { label: 'deflate', value: HTTPCompressionAlgo.deflate },
];

export function fallbackSettings(t: CheckType): Settings {
  switch (t) {
    case CheckType.HTTP: {
      return {
        http: {
          method: HttpMethod.GET,
          ipVersion: IpVersion.V4,
          noFollowRedirects: false,
          compression: HTTPCompressionAlgo.none,
        },
      };
    }
    case CheckType.MULTI_HTTP: {
      return {
        multihttp: {
          entries: [
            {
              request: {
                method: 'GET',
                url: '',
              },
              checks: [],
            },
          ],
        },
      };
    }
    case CheckType.PING: {
      return {
        ping: {
          ipVersion: IpVersion.V4,
          dontFragment: false,
        },
      };
    }
    case CheckType.DNS: {
      return {
        dns: {
          recordType: DnsRecordType.A,
          server: 'dns.google',
          ipVersion: IpVersion.V4,
          protocol: DnsProtocol.UDP,
          port: 53,
          validRCodes: [DnsResponseCodes.NOERROR],
        },
      };
    }
    case CheckType.TCP: {
      return {
        tcp: {
          ipVersion: IpVersion.V4,
          tls: false,
        },
      };
    }
    case CheckType.Traceroute: {
      return {
        traceroute: {
          maxHops: 64,
          maxUnknownHops: 15,
          ptrLookup: true,
        },
      };
    }
    default:
      throw new Error(`Cannot find values for invalid check type ${t}`);
  }
}

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

export const UPTIME_DESCRIPTION = 'The fraction of time the target was up during the whole period.';
export const REACHABILITY_DESCRIPTION =
  'The percentage of all the checks that have succeeded during the whole time period.';
export const LATENCY_DESCRIPTION =
  'The average time to receive an answer across all the checks during the whole time period.';
