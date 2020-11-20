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
} from 'types';

export const DNS_RESPONSE_CODES = enumToStringArray(DnsResponseCodes).map(responseCode => ({
  label: responseCode,
  value: responseCode,
}));

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
    label: 'Seconds',
    value: TimeUnits.seconds,
  },

  {
    label: 'Minutes',
    value: TimeUnits.minutes,
  },

  {
    label: 'Hours',
    value: TimeUnits.hours,
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
  settings: {
    ping: {
      ipVersion: IpVersion.V4,
      dontFragment: false,
    },
  },
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
export const SM_ALERTING_NAMESPACE = 'syntheticmonitoring';
export const ALERTING_SEVERITY_OPTIONS = [
  {
    label: 'Critical',
    value: AlertSeverity.critical,
  },
  {
    label: 'Warning',
    value: AlertSeverity.warn,
  },
  {
    label: 'Error',
    value: AlertSeverity.error,
  },
  {
    label: 'Info',
    value: AlertSeverity.info,
  },
];
