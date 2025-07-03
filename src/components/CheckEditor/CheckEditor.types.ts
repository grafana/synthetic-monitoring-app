import { FormEvent } from 'react';
import { FieldPath } from 'react-hook-form';

import {
  CheckFormValues,
  CheckFormValuesAiAgent,
  CheckFormValuesBrowser,
  CheckFormValuesDns,
  CheckFormValuesGRPC,
  CheckFormValuesHttp,
  CheckFormValuesMultiHttp,
  CheckFormValuesPing,
  CheckFormValuesScripted,
  CheckFormValuesTcp,
  CheckFormValuesTraceroute,
} from 'types';

export type FieldProps<T extends CheckFormValues = CheckFormValues> = {
  name: FieldPath<T>;
  onChange?: (e: FormEvent) => void;
  'aria-label'?: string;
  section?: number;
};

export type TLSConfigFields<T extends CheckFormValues> = {
  tlsServerName?: FieldProps<T>;
  tlsInsecureSkipVerify?: FieldProps<T>;
  tlsCaSCert?: FieldProps<T>;
  tlsClientCert?: FieldProps<T>;
  tlsClientKey?: FieldProps<T>;
};

export type HttpRequestFields<T extends CheckFormValuesHttp | CheckFormValuesMultiHttp> = TLSConfigFields<T> & {
  method: FieldProps<T>;
  target: FieldProps<T>;
  requestHeaders: FieldProps<T>;
  requestBody: FieldProps<T>;
  followRedirects?: FieldProps<T>;
  ipVersion?: FieldProps<T>;
  requestContentType?: FieldProps<T>;
  requestContentEncoding?: FieldProps<T>;
  basicAuth?: FieldProps<T>;
  bearerToken?: FieldProps<T>;
  proxyUrl?: FieldProps<T>;
  proxyHeaders?: FieldProps<T>;
  queryParams?: FieldProps<T>;
};

export type DNSRequestFields = {
  target: FieldProps<CheckFormValuesDns>;
  ipVersion: FieldProps<CheckFormValuesDns>;
  recordType: FieldProps<CheckFormValuesDns>;
  server: FieldProps<CheckFormValuesDns>;
  protocol: FieldProps<CheckFormValuesDns>;
  port: FieldProps<CheckFormValuesDns>;
};

export type GRPCRequestFields = TLSConfigFields<CheckFormValuesGRPC> & {
  ipVersion: FieldProps<CheckFormValuesGRPC>;
  target: FieldProps<CheckFormValuesGRPC>;
  service: FieldProps<CheckFormValuesGRPC>;
  useTLS: FieldProps<CheckFormValuesGRPC>;
};

export type TCPRequestFields = TLSConfigFields<CheckFormValuesTcp> & {
  target: FieldProps<CheckFormValuesTcp>;
  ipVersion: FieldProps<CheckFormValuesTcp>;
  useTLS: FieldProps<CheckFormValuesTcp>;
};

export type PingRequestFields = {
  target: FieldProps<CheckFormValuesPing>;
  ipVersion: FieldProps<CheckFormValuesPing>;
  dontFragment: FieldProps<CheckFormValuesPing>;
};

export type TracerouteRequestFields = {
  target: FieldProps<CheckFormValuesTraceroute>;
  maxHops: FieldProps<CheckFormValuesTraceroute>;
  maxUnknownHops: FieldProps<CheckFormValuesTraceroute>;
  ptrLookup: FieldProps<CheckFormValuesTraceroute>;
};

export type ScriptedFields = {
  target: FieldProps<CheckFormValuesScripted>;
  script: FieldProps<CheckFormValuesScripted>;
};

export type BrowserFields = {
  target: FieldProps<CheckFormValuesBrowser>;
  script: FieldProps<CheckFormValuesBrowser>;
};

export type AiAgentFields = {
  url: FieldProps<CheckFormValuesAiAgent>;
  depth: FieldProps<CheckFormValuesAiAgent>;
  size: FieldProps<CheckFormValuesAiAgent>;
  concurrency: FieldProps<CheckFormValuesAiAgent>;
  durationInMinutes: FieldProps<CheckFormValuesAiAgent>;
  aggressiveness: FieldProps<CheckFormValuesAiAgent>;
};

export type RequestFields =
  | HttpRequestFields<CheckFormValuesHttp>
  | HttpRequestFields<CheckFormValuesMultiHttp>
  | DNSRequestFields
  | GRPCRequestFields
  | TCPRequestFields
  | PingRequestFields
  | TracerouteRequestFields
  | ScriptedFields
  | BrowserFields;
