import { FieldProps, TLSConfigFields } from '../types';
import { CheckFormValuesHttp, CheckFormValuesMultiHttp } from 'types';

type HttpRequestFields<T extends CheckFormValuesHttp | CheckFormValuesMultiHttp> = TLSConfigFields<T> & {
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

const httpCheckFields: HttpRequestFields<CheckFormValuesHttp> = {
  target: {
    name: `target`,
  },
  method: {
    name: `settings.http.method`,
  },
  requestHeaders: {
    name: `settings.http.headers`,
    section: 0,
  },
  ipVersion: {
    name: `settings.http.ipVersion`,
    section: 0,
  },
  followRedirects: {
    name: `settings.http.followRedirects`,
    section: 0,
  },
  requestBody: {
    name: `settings.http.body`,
    section: 2,
  },
  basicAuth: {
    name: `settings.http.basicAuth`,
    section: 3,
  },
  bearerToken: {
    name: `settings.http.bearerToken`,
    section: 3,
  },
  tlsServerName: {
    name: `settings.http.tlsConfig.serverName`,
    section: 4,
  },
  tlsInsecureSkipVerify: {
    name: `settings.http.tlsConfig.insecureSkipVerify`,
    section: 4,
  },
  tlsCaSCert: {
    name: `settings.http.tlsConfig.caCert`,
    section: 4,
  },
  tlsClientCert: {
    name: `settings.http.tlsConfig.clientCert`,
    section: 4,
  },
  tlsClientKey: {
    name: `settings.http.tlsConfig.clientKey`,
    section: 4,
  },
  proxyUrl: {
    name: `settings.http.proxyURL`,
    section: 5,
  },
  proxyHeaders: {
    name: `settings.http.proxyConnectHeaders`,
    section: 5,
  },
};
