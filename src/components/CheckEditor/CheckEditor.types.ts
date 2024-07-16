import { FormEvent } from 'react';
import { FieldPath } from 'react-hook-form';

import {
  CheckFormValues,
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

export type TLSConfigFields = {
  tlsServerName?: FieldProps;
  tlsInsecureSkipVerify?: FieldProps;
  tlsCaSCert?: FieldProps;
  tlsClientCert?: FieldProps;
  tlsClientKey?: FieldProps;
};

export type HttpRequestFields = TLSConfigFields & {
  method: FieldProps<CheckFormValuesHttp | CheckFormValuesMultiHttp>;
  target: FieldProps<CheckFormValuesHttp | CheckFormValuesMultiHttp>;
  requestHeaders: FieldProps<CheckFormValuesHttp | CheckFormValuesMultiHttp>;
  requestBody: FieldProps<CheckFormValuesHttp | CheckFormValuesMultiHttp>;
  followRedirects?: FieldProps<CheckFormValuesHttp | CheckFormValuesMultiHttp>;
  ipVersion?: FieldProps<CheckFormValuesHttp | CheckFormValuesMultiHttp>;
  requestContentType?: FieldProps<CheckFormValuesHttp | CheckFormValuesMultiHttp>;
  requestContentEncoding?: FieldProps<CheckFormValuesHttp | CheckFormValuesMultiHttp>;
  basicAuth?: FieldProps<CheckFormValuesHttp | CheckFormValuesMultiHttp>;
  bearerToken?: FieldProps<CheckFormValuesHttp | CheckFormValuesMultiHttp>;
  proxyUrl?: FieldProps<CheckFormValuesHttp | CheckFormValuesMultiHttp>;
  proxyHeaders?: FieldProps<CheckFormValuesHttp | CheckFormValuesMultiHttp>;
  queryParams?: FieldProps<CheckFormValuesHttp | CheckFormValuesMultiHttp>;
};

export type DNSRequestFields = {
  target: FieldProps<CheckFormValuesDns>;
  ipVersion: FieldProps<CheckFormValuesDns>;
  recordType: FieldProps<CheckFormValuesDns>;
  server: FieldProps<CheckFormValuesDns>;
  protocol: FieldProps<CheckFormValuesDns>;
  port: FieldProps<CheckFormValuesDns>;
};

export type GRPCRequestFields = TLSConfigFields & {
  ipVersion: FieldProps<CheckFormValuesGRPC>;
  target: FieldProps<CheckFormValuesGRPC>;
  service: FieldProps<CheckFormValuesGRPC>;
  useTLS: FieldProps<CheckFormValuesGRPC>;
};

export type TCPRequestFields = TLSConfigFields & {
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

export type ScriptedRequestFields = {
  target: FieldProps<CheckFormValuesScripted>;
  script: FieldProps<CheckFormValuesScripted>;
};

export type RequestFields =
  | HttpRequestFields
  | DNSRequestFields
  | GRPCRequestFields
  | TCPRequestFields
  | PingRequestFields
  | TracerouteRequestFields
  | ScriptedRequestFields;
