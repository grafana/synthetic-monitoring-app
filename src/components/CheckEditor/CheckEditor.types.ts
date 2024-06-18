import { FormEvent } from 'react';
import { FieldPath } from 'react-hook-form';

import { CheckFormValues, CheckFormValuesPing, CheckFormValuesScripted } from 'types';

export type FieldProps<T extends CheckFormValues = CheckFormValues> = {
  name: FieldPath<T>;
  onChange?: (e: FormEvent) => void;
  'aria-label'?: string;
};

export type TLSConfigFields = {
  tlsServerName?: FieldProps;
  tlsInsecureSkipVerify?: FieldProps;
  tlsCaSCert?: FieldProps;
  tlsClientCert?: FieldProps;
  tlsClientKey?: FieldProps;
};

export type HttpRequestFields = TLSConfigFields & {
  method: FieldProps;
  target: FieldProps;
  requestHeaders: FieldProps;
  requestBody: FieldProps;
  followRedirects?: FieldProps;
  ipVersion?: FieldProps;
  requestContentType?: FieldProps;
  requestContentEncoding?: FieldProps;
  basicAuth?: FieldProps;
  bearerToken?: FieldProps;
  proxyUrl?: FieldProps;
  proxyHeaders?: FieldProps;
};

export type DNSRequestFields = {
  target: FieldProps;
  ipVersion: FieldProps;
  recordType: FieldProps;
  server: FieldProps;
  protocol: FieldProps;
  port: FieldProps;
};

export type GRPCRequestFields = TLSConfigFields & {
  ipVersion: FieldProps;
  target: FieldProps;
  service: FieldProps;
  useTLS: FieldProps;
};

export type TCPRequestFields = TLSConfigFields & {
  target: FieldProps;
  ipVersion: FieldProps;
  useTLS: FieldProps;
};

export type PingRequestFields = {
  target: FieldProps<CheckFormValuesPing>;
  ipVersion: FieldProps<CheckFormValuesPing>;
  dontFragment: FieldProps<CheckFormValuesPing>;
};

export type TracerouteRequestFields = {
  target: FieldProps;
  maxHops: FieldProps;
  maxUnknownHops: FieldProps;
  ptrLookup: FieldProps;
};

export type ScriptedRequestFields = {
  target: FieldProps<CheckFormValuesScripted>;
  script: FieldProps<CheckFormValuesScripted>;
};
