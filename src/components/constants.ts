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
  AlertSeverity,
  AlertSensitivity,
  CheckSort,
  CheckEnabledStatus,
  CheckListViewType,
  HTTPCompressionAlgo,
  ResponseMatchType,
  HttpSettings,
  Settings,
  HttpMethod,
} from 'types';

export const DNS_RESPONSE_CODES = enumToStringArray(DnsResponseCodes).map((responseCode) => ({
  label: responseCode,
  value: responseCode,
}));

export const DNS_RESPONSE_MATCH_OPTIONS = [
  { label: `Validate ${ResponseMatchType.Authority} matches`, value: ResponseMatchType.Authority },
  { label: `Validate ${ResponseMatchType.Answer} matches`, value: ResponseMatchType.Answer },
  { label: `Validate ${ResponseMatchType.Additional} matches`, value: ResponseMatchType.Additional },
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

export const DEFAULT_API_HOST = 'https://synthetic-monitoring-api.grafana.net';

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

export const fallbackCheck = {
  job: '',
  target: '',
  frequency: 60000,
  timeout: 3000,
  enabled: true,
  labels: [],
  probes: [],
  alertSensitivity: AlertSensitivity.None,
  settings: {
    http: fallbackSettings(CheckType.HTTP) as HttpSettings,
  },
  basicMetricsOnly: true,
} as Check;

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

export const DEFAULT_ALERT_NAMES_BY_SENSITIVITY = {
  [AlertSensitivity.Low]: 'SyntheticMonitoringCheckFailureAtLowSensitivity',
  [AlertSensitivity.Medium]: 'SyntheticMonitoringCheckFailureAtMediumSensitivity',
  [AlertSensitivity.High]: 'SyntheticMonitoringCheckFailureAtHighSensitivity',
};

export const ALERT_RECORDING_METRIC = 'instance_job_severity:probe_success:mean5m';

export const ALERT_RECORDING_EXPR = `(sum without(probe, config_version) (rate(probe_all_success_sum[5m]) *
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
          firstHop: 1,
          maxHops: 64,
          retries: 0,
          maxUnknownHops: 15,
        },
      };
    }
    default:
      throw new Error(`Cannot find values for invalid check type ${t}`);
  }
}

export const PLUGIN_URL_PATH = '/a/grafana-synthetic-monitoring-app/';
