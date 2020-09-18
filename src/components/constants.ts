import { enumToStringArray } from '../utils';
import { DnsResponseCodes, DnsRecordType, DnsProtocol, IpVersion, CheckType, HttpSslOption } from 'types';

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
