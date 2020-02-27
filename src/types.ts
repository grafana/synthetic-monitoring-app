export interface ExampleAppSettings {
  customText?: string;
  customCheckbox?: boolean;
}

export type CheckSettings = PingSettings | HttpSettings | DnsSettings;

// The "settings" field defines the type of check.
export interface Check {
  id: number;
  orgId: number;
  frequency: number;
  offset: number;
  timeout: number;
  enabled: boolean;
  tags: string[];
  settings: CheckSettings;
  created: number;
  modified: number;
}

export enum IpVersion {
  Any = 'Any',
  V4 = 'V4',
  V6 = 'V6',
}

export enum ValidationMethod {
  Regex = 'Regex',
  IncludesText = 'IncludesText',
  ExcludesText = 'ExcludesText',
  ExactMatch = 'ExactMatch',
}

export enum ValidationSeverity {
  Warning = 'Warning',
  Critical = 'Critical',
}

export interface Validation {
  severity: ValidationSeverity;
}

export interface ResponseTimeValidation extends Validation {
  threshold: number;
}

export interface PingValidation {
  responseTime?: ResponseTimeValidation;
}

export interface PingSettings {
  hostname: string;
  ipVersion: IpVersion;
  validation: PingValidation[]; // only a single check actually makes sense
}

export enum HttpMethod {
  GET = 'GET',
  HEAD = 'HEAD',
  POST = 'POST',
  OPTIONS = 'OPTIONS',
}

export enum DnsRecordType {
  A = 'A',
  AAAA = 'AAAA',
  CNAME = 'CNAME',
  MX = 'MX',
  NS = 'NS',
  PTR = 'PTR',
  SOA = 'SOA',
  SRV = 'SRV',
  TXT = 'TXT',
}

export enum DnsProtocol {
  TCP = 'TCP',
  UDP = 'UDP',
}

export interface HttpBodyValidation extends Validation {
  method: ValidationMethod;
  value: string;
}

export interface HttpHeaderValidation extends Validation {
  header: string;
  method: ValidationMethod;
  value: string;
}

export interface HttpValidation {
  responseTime?: ResponseTimeValidation;
  body?: HttpBodyValidation;
  header?: HttpHeaderValidation;
}

// HttpSettings provides the settings for a HTTP check.
export interface HttpSettings {
  url: string;
  method: HttpMethod;
  headers?: string[];
  body?: string;
  downloadLimit?: number;
  ipVersion: IpVersion;
  validateCert: boolean;
  validation: HttpValidation[];
}

export interface DnsTtlValidation extends Validation {
  name: string;
  value: string;
}

export interface DnsTextValidation extends Validation {
  method: ValidationMethod;
  value: string;
}

export interface DnsHostValidation extends Validation {
  host: string[];
}

export type DnsValidations = ResponseTimeValidation | DnsTtlValidation | DnsTextValidation | DnsHostValidation;

// DnsSettings provides the settings for a DNS check.
export interface DnsSettings {
  name: string;
  recordType: DnsRecordType;
  server: string;
  ipVersion: IpVersion;
  protocol: DnsProtocol;
  port: number;
  validation: DnsValidations[];
}
