import { SelectableValue } from '@grafana/data';
import isBase64 from 'is-base64';

import {
  AlertSensitivity,
  Check,
  CheckFormValues,
  CheckFormValuesDns,
  CheckFormValuesGRPC,
  CheckFormValuesHttp,
  CheckFormValuesMultiHttp,
  CheckFormValuesPing,
  CheckFormValuesScripted,
  CheckFormValuesTcp,
  CheckFormValuesTraceroute,
  CheckType,
  DNSCheck,
  DNSRRValidator,
  DnsSettings,
  DnsSettingsFormValues,
  DnsValidationFormValue,
  GRPCCheck,
  GRPCSettingsFormValues,
  HeaderMatch,
  HTTPCheck,
  HttpMethod,
  HttpRegexValidationFormValue,
  HttpRegexValidationType,
  HttpSettings,
  HttpSettingsFormValues,
  HttpSslOption,
  Label,
  MultiHttpAssertionType,
  MultiHTTPCheck,
  MultiHttpSettings,
  MultiHttpSettingsFormValues,
  PingCheck,
  PingSettings,
  PingSettingsFormValues,
  ResponseMatchType,
  ScriptedCheck,
  TCPCheck,
  TCPQueryResponse,
  TcpSettings,
  TcpSettingsFormValues,
  TLSConfig,
  TracerouteCheck,
  TracerouteSettings,
  TracerouteSettingsFormValues,
} from 'types';
import {
  isDNSCheck,
  isGRPCCheck,
  isHttpCheck,
  isMultiHttpCheck,
  isPingCheck,
  isTCPCheck,
  isTracerouteCheck,
} from 'utils.types';
import { fromBase64, toBase64 } from 'utils';
import {
  ASSERTION_CONDITION_OPTIONS,
  ASSERTION_SUBJECT_OPTIONS,
  DNS_RESPONSE_CODES,
  DNS_RESPONSE_MATCH_OPTIONS,
  FALLBACK_CHECK_DNS,
  FALLBACK_CHECK_HTTP,
  FALLBACK_CHECK_MULTIHTTP,
  FALLBACK_CHECK_PING,
  FALLBACK_CHECK_TCP,
  FALLBACK_CHECK_TRACEROUTE,
  HTTP_COMPRESSION_ALGO_OPTIONS,
  HTTP_REGEX_VALIDATION_OPTIONS,
  HTTP_SSL_OPTIONS,
  IP_OPTIONS,
  METHOD_OPTIONS,
  MULTI_HTTP_ASSERTION_TYPE_OPTIONS,
  MULTI_HTTP_VARIABLE_TYPE_OPTIONS,
} from 'components/constants';
import { MultiHttpRequestBody } from 'components/MultiHttp/MultiHttpTypes';

export const ensureBase64 = (value: string) => (isBase64(value, { paddingRequired: true }) ? value : toBase64(value));

export function selectableValueFrom<T>(value: T, label?: string): SelectableValue<T> {
  const labelValue = String(value);
  return { label: label ?? labelValue, value };
}
const getPingSettingsFormValues = (settings: PingCheck['settings']): PingSettingsFormValues => {
  const pingSettings = settings.ping ?? FALLBACK_CHECK_PING.settings.ping;

  return {
    ...pingSettings,
    ipVersion: IP_OPTIONS.find(({ value }) => value === settings?.ping?.ipVersion) ?? IP_OPTIONS[1],
  };
};

const headersToLabels = (headers: string[]): Label[] =>
  headers.map((header) => {
    const parts = header.split(':');
    const value = parts.slice(1).join(':');
    return {
      name: parts[0],
      value: value,
    };
  });

const getHttpSettingsSslValue = (failIfSSL: boolean, failIfNotSSL: boolean): SelectableValue<HttpSslOption> => {
  if (failIfSSL && !failIfNotSSL) {
    return (
      HTTP_SSL_OPTIONS.find((option: SelectableValue<HttpSslOption>) => option.value === HttpSslOption.FailIfPresent) ??
      HTTP_SSL_OPTIONS[0]
    );
  }

  if (!failIfSSL && failIfNotSSL) {
    return (
      HTTP_SSL_OPTIONS.find(
        (option: SelectableValue<HttpSslOption>) => option.value === HttpSslOption.FailIfNotPresent
      ) ?? HTTP_SSL_OPTIONS[0]
    );
  }

  return HTTP_SSL_OPTIONS[0];
};

const getDecodedIfPEM = (cert = '') => {
  const decoded = fromBase64(cert);
  if (decoded === undefined) {
    return cert;
  }
  if (decoded.indexOf('BEGIN') > 0) {
    return decoded;
  }
  return cert;
};

const getTlsConfigFormValues = (tlsConfig?: TLSConfig) => {
  if (!tlsConfig) {
    return {};
  }

  return {
    tlsConfig: {
      ...tlsConfig,
      caCert: getDecodedIfPEM(tlsConfig.caCert),
      clientCert: getDecodedIfPEM(tlsConfig.clientCert),
      clientKey: getDecodedIfPEM(tlsConfig.clientKey),
    },
  };
};

const getHttpRegexValidationFormValues = (
  validationSettings: HttpSettingsValidations
): HttpRegexValidationFormValue[] => {
  const bodyRegexes = new Set(['failIfBodyMatchesRegexp', 'failIfBodyNotMatchesRegexp']);
  const headerRegexes = new Set(['failIfHeaderMatchesRegexp', 'failIfHeaderNotMatchesRegexp']);
  const invertedTypes = new Set(['failIfBodyNotMatchesRegexp', 'failIfHeaderNotMatchesRegexp']);
  return Object.keys(validationSettings).reduce<HttpRegexValidationFormValue[]>((validationFormValues, regexType) => {
    const validations = validationSettings[regexType as keyof HttpSettingsValidations] ?? [];
    validations.forEach((validation: string | HeaderMatch) => {
      if (bodyRegexes.has(regexType)) {
        validationFormValues.push({
          matchType: selectableValueFrom(HttpRegexValidationType.Body, HTTP_REGEX_VALIDATION_OPTIONS[1].label),
          expression: validation as string,
          inverted: invertedTypes.has(regexType),
        });
      } else if (headerRegexes.has(regexType)) {
        const headerMatch = validation as HeaderMatch;
        validationFormValues.push({
          matchType: selectableValueFrom(HttpRegexValidationType.Header, HTTP_REGEX_VALIDATION_OPTIONS[0].label),
          expression: headerMatch.regexp,
          header: headerMatch.header,
          allowMissing: headerMatch.allowMissing,
          inverted: invertedTypes.has(regexType),
        });
      }
    });
    return validationFormValues;
  }, []);
};

const getHttpSettingsFormValues = (settings: HTTPCheck['settings']): HttpSettingsFormValues => {
  const httpSettings = settings.http ?? FALLBACK_CHECK_HTTP.settings.http;
  const {
    failIfBodyMatchesRegexp,
    failIfBodyNotMatchesRegexp,
    failIfHeaderMatchesRegexp,
    failIfHeaderNotMatchesRegexp,
    noFollowRedirects,
    tlsConfig,
    compression,
    ...pickedSettings
  } = httpSettings;

  const regexValidations = getHttpRegexValidationFormValues({
    failIfBodyMatchesRegexp,
    failIfBodyNotMatchesRegexp,
    failIfHeaderMatchesRegexp,
    failIfHeaderNotMatchesRegexp,
  });

  const transformedTlsConfig = getTlsConfigFormValues(tlsConfig);

  return {
    ...pickedSettings,
    ...transformedTlsConfig,
    followRedirects: !noFollowRedirects,
    sslOptions: getHttpSettingsSslValue(httpSettings.failIfSSL ?? false, httpSettings.failIfNotSSL ?? false),
    validStatusCodes: httpSettings.validStatusCodes?.map((statusCode) => selectableValueFrom(statusCode)) ?? [],
    validHTTPVersions: httpSettings.validHTTPVersions?.map((httpVersion) => selectableValueFrom(httpVersion)) ?? [],
    method: selectableValueFrom(httpSettings.method),
    ipVersion: selectableValueFrom(httpSettings.ipVersion),
    headers: headersToLabels(httpSettings.headers || []),
    proxyConnectHeaders: headersToLabels(httpSettings.proxyConnectHeaders || []),
    regexValidations,
    compression: compression ? selectableValueFrom(compression) : HTTP_COMPRESSION_ALGO_OPTIONS[0],
  };
};

const getTcpQueryResponseFormValues = (queryResponses: TCPQueryResponse[]) => {
  return queryResponses.map(({ send, expect, startTLS }) => ({
    startTLS,
    send: fromBase64(send),
    expect: fromBase64(expect),
  }));
};

const getTcpSettingsFormValues = (settings: TCPCheck['settings']): TcpSettingsFormValues => {
  const tcpSettings = settings.tcp ?? FALLBACK_CHECK_TCP.settings.tcp;
  const formattedQueryResponse = getTcpQueryResponseFormValues(tcpSettings.queryResponse);
  const tlsConfig = getTlsConfigFormValues(tcpSettings.tlsConfig);

  return {
    ...tcpSettings,
    ...tlsConfig,
    ipVersion: selectableValueFrom(tcpSettings.ipVersion),
    queryResponse: formattedQueryResponse,
  };
};

type GetDnsValidationArgs = { [key in ResponseMatchType]: DNSRRValidator | undefined };

const getDnsValidations = (validations: GetDnsValidationArgs): DnsValidationFormValue[] =>
  Object.keys(validations).reduce<DnsValidationFormValue[]>((formValues, validationType) => {
    const responseMatch = validationType as ResponseMatchType;
    validations[responseMatch]?.failIfMatchesRegexp?.forEach((expression) => {
      formValues.push({
        expression,
        inverted: false,
        responseMatch:
          DNS_RESPONSE_MATCH_OPTIONS.find(({ value }) => value === responseMatch) ?? DNS_RESPONSE_MATCH_OPTIONS[0],
      });
    });

    validations[responseMatch]?.failIfNotMatchesRegexp?.forEach((expression) => {
      formValues.push({
        expression,
        inverted: true,
        responseMatch:
          DNS_RESPONSE_MATCH_OPTIONS.find(({ value }) => value === responseMatch) ?? DNS_RESPONSE_MATCH_OPTIONS[0],
      });
    });
    return formValues;
  }, []);

const getDnsSettingsFormValues = (settings: DNSCheck['settings']): DnsSettingsFormValues => {
  const dnsSettings = settings.dns ?? FALLBACK_CHECK_DNS.settings.dns;

  return {
    ...dnsSettings,
    ipVersion: selectableValueFrom(dnsSettings.ipVersion),
    protocol: selectableValueFrom(dnsSettings.protocol),
    recordType: selectableValueFrom(dnsSettings.recordType),
    validRCodes:
      (dnsSettings.validRCodes
        ?.map((responseCode) => DNS_RESPONSE_CODES.find((option) => option.value === responseCode))
        .filter(Boolean) as Array<SelectableValue<string>>) ?? [],
    validations: getDnsValidations({
      [ResponseMatchType.Answer]: dnsSettings.validateAnswerRRS,
      [ResponseMatchType.Authority]: dnsSettings.validateAuthorityRRS,
      [ResponseMatchType.Additional]: dnsSettings.validateAditionalRRS,
    }),
  };
};

const getGRPCSettingsFormValues = (settings: GRPCCheck['settings']): GRPCSettingsFormValues => {
  return {};
};

const getTracerouteSettingsFormValues = (settings: TracerouteCheck['settings']): TracerouteSettingsFormValues => {
  const tracerouteSettings = settings.traceroute ?? FALLBACK_CHECK_TRACEROUTE.settings.traceroute;

  return {
    maxHops: String(tracerouteSettings.maxHops),
    ptrLookup: tracerouteSettings.ptrLookup,
    maxUnknownHops: String(tracerouteSettings.maxUnknownHops),
    hopTimeout: tracerouteSettings.hopTimeout,
  };
};

function getBaseFormValuesFromCheck(check: Check): Omit<CheckFormValues, 'checkType' | 'settings'> {
  return {
    alertSensitivity: check.alertSensitivity,
    publishAdvancedMetrics: !check.basicMetricsOnly,
    enabled: check.enabled,
    frequency: check.frequency / 1000,
    id: check.id,
    job: check.job,
    labels: check.labels,
    probes: check.probes,
    target: check.target,
    timeout: check.timeout / 1000,
  };
}

// export function getFormValuesFromCheck(check: DNSCheck): CheckFormValuesDns;
// export function getFormValuesFromCheck(check: GRPCCheck): CheckFormValuesGRPC;
// export function getFormValuesFromCheck(check: HTTPCheck): CheckFormValuesHttp;
// export function getFormValuesFromCheck(check: PingCheck): CheckFormValuesPing;
// export function getFormValuesFromCheck(check: TCPCheck): CheckFormValuesTcp;
// export function getFormValuesFromCheck(check: TracerouteCheck): CheckFormValuesTraceroute;
export function getFormValuesFromCheck(check: Check): CheckFormValues {
  const base = getBaseFormValuesFromCheck(check);

  if (isDNSCheck(check)) {
    const formValues: CheckFormValuesDns = {
      ...base,
      checkType: CheckType.DNS,
      settings: {
        dns: getDnsSettingsFormValues(check.settings),
      },
    };

    return formValues;
  }

  if (isGRPCCheck(check)) {
    const formValues: CheckFormValuesGRPC = {
      ...base,
      checkType: CheckType.GRPC,
      settings: {
        grpc: getGRPCSettingsFormValues(check.settings),
      },
    };

    return formValues;
  }

  if (isHttpCheck(check)) {
    const formValues: CheckFormValuesHttp = {
      ...base,
      checkType: CheckType.HTTP,
      settings: {
        http: getHttpSettingsFormValues(check.settings),
      },
    };

    return formValues;
  }

  if (isMultiHttpCheck(check)) {
    const formValues: CheckFormValuesMultiHttp = {
      ...base,
      checkType: CheckType.MULTI_HTTP,
      settings: {
        multihttp: getMultiHttpFormValues(check.settings),
      },
    };

    return formValues;
  }

  if (isPingCheck(check)) {
    const formValues: CheckFormValuesPing = {
      ...base,
      checkType: CheckType.PING,
      settings: {
        ping: getPingSettingsFormValues(check.settings),
      },
    };

    return formValues;
  }

  if (isTCPCheck(check)) {
    const formValues: CheckFormValuesTcp = {
      ...base,
      checkType: CheckType.TCP,
      settings: {
        tcp: getTcpSettingsFormValues(check.settings),
      },
    };

    return formValues;
  }

  if (isTracerouteCheck(check)) {
    const formValues: CheckFormValuesTraceroute = {
      ...base,
      checkType: CheckType.Traceroute,
      settings: {
        traceroute: getTracerouteSettingsFormValues(check.settings),
      },
    };

    return formValues;
  }

  throw new Error(`Unknown check type`);
}

export function getMultiHttpFormValuesFromCheck(check: MultiHTTPCheck): CheckFormValuesMultiHttp {
  const base = getBaseFormValuesFromCheck(check);

  return {
    ...base,
    checkType: CheckType.MULTI_HTTP,
    settings: {
      multihttp: getMultiHttpFormValues(check.settings),
    },
  };
}

export function getScriptedFormValuesFromCheck(check: ScriptedCheck): CheckFormValuesScripted {
  const base = getBaseFormValuesFromCheck(check);

  return {
    ...base,
    checkType: CheckType.K6,
    settings: {
      k6: getScriptedCheckFormValues(check.settings),
    },
  };
}

export function getValueFromSelectable<T>(selectable: SelectableValue<T> | undefined): T | undefined {
  if (!selectable?.value) {
    return undefined;
  }
  return selectable.value;
}

function getValuesFromMultiSelectables<T>(selectables: Array<SelectableValue<T>> | undefined): T[] | undefined {
  return selectables?.map((selectable) => getValueFromSelectable(selectable)).filter(Boolean) as T[];
}

const getHttpSslOptionsFromFormValue = (sslOption: HttpSslOption): Pick<HttpSettings, 'failIfSSL' | 'failIfNotSSL'> => {
  switch (sslOption) {
    case HttpSslOption.Ignore: {
      return {
        failIfNotSSL: false,
        failIfSSL: false,
      };
    }
    case HttpSslOption.FailIfPresent: {
      return {
        failIfNotSSL: false,
        failIfSSL: true,
      };
    }
    case HttpSslOption.FailIfNotPresent: {
      return {
        failIfNotSSL: true,
        failIfSSL: false,
      };
    }
  }
};

const getTlsConfigFromFormValues = (tlsConfig?: TLSConfig) => {
  if (!tlsConfig) {
    return {};
  }

  return {
    tlsConfig: {
      clientCert: tlsConfig.clientCert && ensureBase64(tlsConfig.clientCert),
      caCert: tlsConfig.caCert && ensureBase64(tlsConfig.caCert),
      clientKey: tlsConfig.clientKey && ensureBase64(tlsConfig.clientKey),
      insecureSkipVerify: tlsConfig.insecureSkipVerify,
      serverName: tlsConfig.serverName,
    },
  };
};

type HttpSettingsValidations = Pick<
  HttpSettings,
  | 'failIfBodyMatchesRegexp'
  | 'failIfBodyNotMatchesRegexp'
  | 'failIfHeaderMatchesRegexp'
  | 'failIfHeaderNotMatchesRegexp'
>;

const getHttpRegexValidationsFromFormValue = (validations: HttpRegexValidationFormValue[]): HttpSettingsValidations =>
  validations.reduce<HttpSettingsValidations>(
    (results, validation) => {
      switch (validation.matchType.value) {
        case HttpRegexValidationType.Body: {
          if (validation.inverted) {
            results.failIfBodyNotMatchesRegexp?.push(validation.expression);
          } else {
            results.failIfBodyMatchesRegexp?.push(validation.expression);
          }
          break;
        }
        case HttpRegexValidationType.Header: {
          if (validation.inverted) {
            results.failIfHeaderNotMatchesRegexp?.push({
              header: validation.header ?? '',
              regexp: validation.expression,
              allowMissing: validation.allowMissing ?? false,
            });
          } else {
            results.failIfHeaderMatchesRegexp?.push({
              header: validation.header ?? '',
              regexp: validation.expression,
              allowMissing: validation.allowMissing ?? false,
            });
          }
          break;
        }
      }
      return results;
    },
    {
      failIfBodyMatchesRegexp: [],
      failIfBodyNotMatchesRegexp: [],
      failIfHeaderMatchesRegexp: [],
      failIfHeaderNotMatchesRegexp: [],
    }
  );

const getHttpSettings = (settings: Partial<HttpSettingsFormValues> | undefined = {}): HttpSettings => {
  const headers = settings.headers ?? [];
  const formattedHeaders = headers?.map((header) => `${header.name}:${header.value}`) ?? [];
  const proxyHeaders = settings.proxyConnectHeaders ?? [];
  const formattedProxyHeaders = proxyHeaders?.map((header) => `${header.name}:${header.value}`) ?? [];

  const method = getValueFromSelectable(settings?.method) ?? FALLBACK_CHECK_HTTP.settings.http.method;

  const sslConfig = getHttpSslOptionsFromFormValue(getValueFromSelectable(settings.sslOptions) ?? HttpSslOption.Ignore);

  const compression = getValueFromSelectable(settings.compression);

  const validationRegexes = getHttpRegexValidationsFromFormValue(settings.regexValidations ?? []);

  // We need to pick the sslOptions key out of the settings, since the API doesn't expect this key
  const { sslOptions, regexValidations, followRedirects, tlsConfig, ...restToKeep } = settings;

  const transformedTlsConfig = getTlsConfigFromFormValues(tlsConfig);

  return {
    ...restToKeep,
    ...sslConfig,
    ...validationRegexes,
    ...transformedTlsConfig,
    noFollowRedirects: !followRedirects,
    method,
    headers: formattedHeaders,
    proxyConnectHeaders: formattedProxyHeaders,
    ipVersion: getValueFromSelectable(settings?.ipVersion) ?? FALLBACK_CHECK_HTTP.settings.http.ipVersion,
    validStatusCodes: getValuesFromMultiSelectables(settings?.validStatusCodes),
    validHTTPVersions: getValuesFromMultiSelectables(settings?.validHTTPVersions),
    compression,
  };
};

const getMultiHttpSettings = (settings: MultiHttpSettingsFormValues | undefined): MultiHttpSettings => {
  if (!settings) {
    return FALLBACK_CHECK_MULTIHTTP.settings.multihttp;
  }

  return {
    entries: settings.entries?.map((entry, index) => {
      const includeBody =
        entry.request.body?.contentEncoding || entry.request.body?.contentType || entry.request.body?.payload;
      const body = includeBody
        ? ({ ...entry.request.body, payload: toBase64(entry.request.body?.payload ?? '') } as MultiHttpRequestBody)
        : undefined;

      return {
        ...entry,
        request: {
          ...entry.request,
          body,
          method: getValueFromSelectable(entry.request.method) ?? HttpMethod.GET,
        },
        variables:
          entry.variables?.map((variable) => {
            if (variable.type.value === undefined) {
              throw new Error('Selecting a variable type is required');
            }
            return {
              ...variable,
              type: variable.type.value,
            };
          }) ?? [],
        checks:
          entry.checks?.map(({ type, subject, condition, value, expression }) => {
            switch (type.value) {
              case MultiHttpAssertionType.Text:
                if (subject?.value === undefined || condition?.value === undefined) {
                  throw new Error('Cannot have a Text assertion without a subject and condition');
                }
                return {
                  type: type.value,
                  subject: subject.value,
                  condition: condition.value,
                  value,
                };
              case MultiHttpAssertionType.JSONPath:
                return {
                  type: type.value,
                  expression,
                };
              case MultiHttpAssertionType.JSONPathValue:
                if (condition?.value === undefined) {
                  throw new Error('Cannot have a JSON path value assertion without a condition');
                }
                return {
                  type: type.value,
                  condition: condition.value,
                  expression,
                  value,
                };
              case MultiHttpAssertionType.Regex:
                if (subject?.value === undefined) {
                  throw new Error('Cannot have a Regex assertion without a subject');
                }
                return {
                  type: type.value,
                  subject: subject.value,
                  expression,
                };
              default:
                throw new Error('invalid assertion type');
            }
          }) ?? [],
      };
    }),
  };
};

const getMultiHttpFormValues = (settings: MultiHTTPCheck['settings']): MultiHttpSettingsFormValues => {
  const multiHttpSettings = settings.multihttp ?? FALLBACK_CHECK_MULTIHTTP.settings.multihttp;

  return {
    entries: multiHttpSettings.entries?.map((entry) => {
      return {
        request: {
          ...entry.request,
          body: entry.request.body
            ? {
                ...entry.request.body,
                payload: fromBase64(entry.request.body?.payload ?? ''),
              }
            : undefined,
          method: METHOD_OPTIONS.find(({ value }) => value === entry.request.method) ?? METHOD_OPTIONS[0],
        },
        variables:
          entry.variables?.map(({ type, name, expression, attribute }) => {
            return {
              type:
                MULTI_HTTP_VARIABLE_TYPE_OPTIONS.find(({ value }) => value === type) ??
                MULTI_HTTP_VARIABLE_TYPE_OPTIONS[0],
              name,
              expression,
              attribute,
            };
          }) ?? [],
        checks:
          entry.checks?.map(({ type, subject, condition, expression, value }) => {
            return {
              type:
                MULTI_HTTP_ASSERTION_TYPE_OPTIONS.find(({ value }) => value === type) ??
                MULTI_HTTP_ASSERTION_TYPE_OPTIONS[0],
              subject: ASSERTION_SUBJECT_OPTIONS.find(({ value }) => value === subject),
              condition: ASSERTION_CONDITION_OPTIONS.find(({ value }) => value === condition),
              expression,
              value,
            };
          }) ?? [],
      };
    }),
  };
};

function getScriptedCheckFormValues(settings: ScriptedCheck['settings']) {
  return {
    script: atob(settings.k6?.script),
  };
}

const getTcpQueryResponseFromFormFields = (queryResponses: TCPQueryResponse[]) => {
  return queryResponses.map(({ send, expect, startTLS }) => {
    return {
      startTLS,
      send: toBase64(send),
      expect: toBase64(expect),
    };
  });
};

const getTcpSettings = (settings: TcpSettingsFormValues): TcpSettings => {
  const fallbackValues = FALLBACK_CHECK_TCP.settings.tcp;

  const tlsConfig = getTlsConfigFromFormValues(settings.tlsConfig);
  const queryResponse = getTcpQueryResponseFromFormFields(settings.queryResponse);

  return {
    ...fallbackValues,
    ...tlsConfig,
    tls: settings.tls,
    ipVersion: getValueFromSelectable(settings?.ipVersion) ?? fallbackValues.ipVersion,
    queryResponse,
  };
};

const getPingSettings = (settings: Partial<PingSettingsFormValues> | undefined = {}): PingSettings => {
  const fallbackValues = FALLBACK_CHECK_PING.settings.ping;

  return {
    ...fallbackValues,
    ipVersion: getValueFromSelectable(settings.ipVersion) ?? fallbackValues.ipVersion,
  };
};

type DnsValidations = Pick<DnsSettings, 'validateAditionalRRS' | 'validateAnswerRRS' | 'validateAuthorityRRS'>;

const getDnsValidationsFromFormValues = (validations: DnsValidationFormValue[]): DnsValidations =>
  validations.reduce<DnsValidations>(
    (acc, validation) => {
      const destinationName = validation.inverted ? 'failIfNotMatchesRegexp' : 'failIfMatchesRegexp';
      const responseMatch = getValueFromSelectable(validation.responseMatch);
      switch (responseMatch) {
        case ResponseMatchType.Additional:
          acc.validateAditionalRRS![destinationName].push(validation.expression);
          break;
        case ResponseMatchType.Answer:
          acc.validateAnswerRRS![destinationName].push(validation.expression);
          break;
        case ResponseMatchType.Authority:
          acc.validateAuthorityRRS![destinationName].push(validation.expression);
          break;
      }
      return acc;
    },
    {
      validateAnswerRRS: {
        failIfMatchesRegexp: [],
        failIfNotMatchesRegexp: [],
      },
      validateAuthorityRRS: {
        failIfMatchesRegexp: [],
        failIfNotMatchesRegexp: [],
      },
      validateAditionalRRS: {
        failIfMatchesRegexp: [],
        failIfNotMatchesRegexp: [],
      },
    }
  );

const getDnsSettings = (settings: DnsSettingsFormValues): DnsSettings => {
  const fallbackValues = FALLBACK_CHECK_DNS.settings.dns;
  const validations = getDnsValidationsFromFormValues(settings.validations);

  return {
    recordType: getValueFromSelectable(settings?.recordType) ?? fallbackValues.recordType,
    server: settings?.server ?? fallbackValues.server,
    ipVersion: getValueFromSelectable(settings?.ipVersion) ?? fallbackValues.ipVersion,
    protocol: getValueFromSelectable(settings?.protocol) ?? fallbackValues.protocol,
    port: Number(settings?.port) ?? fallbackValues.port,
    validRCodes: getValuesFromMultiSelectables(settings?.validRCodes) ?? fallbackValues.validRCodes,
    ...validations,
  };
};

const getTracerouteSettings = (settings: TracerouteSettingsFormValues | undefined): TracerouteSettings => {
  const fallbackValues = FALLBACK_CHECK_TRACEROUTE.settings.traceroute;
  const updatedSettings = settings ?? fallbackValues;

  return {
    maxHops: parseInt(String(updatedSettings.maxHops), 10),
    ptrLookup: updatedSettings.ptrLookup,
    maxUnknownHops: parseInt(String(updatedSettings.maxUnknownHops), 10),
    hopTimeout: updatedSettings.hopTimeout,
  };
};

export const getCheckFromFormValues = (formValues: CheckFormValues): Check => {
  const base = {
    alertSensitivity: formValues.alertSensitivity ?? AlertSensitivity.None,
    basicMetricsOnly: !formValues.publishAdvancedMetrics,
    enabled: formValues.enabled,
    frequency: formValues.frequency * 1000,
    id: formValues.id,
    job: formValues.job,
    labels: formValues.labels,
    probes: formValues.probes,
    target: formValues.target,
    timeout: formValues.timeout * 1000,
  };

  if (formValues.checkType === CheckType.DNS) {
    return {
      ...base,
      settings: {
        dns: getDnsSettings(formValues.settings.dns),
      },
    };
  }

  if (formValues.checkType === CheckType.HTTP) {
    return {
      ...base,
      settings: {
        http: getHttpSettings(formValues.settings.http),
      },
    };
  }

  if (formValues.checkType === CheckType.MULTI_HTTP) {
    return {
      ...base,
      target: formValues?.settings?.multihttp?.entries[0]?.request.url,
      settings: {
        multihttp: getMultiHttpSettings(formValues.settings.multihttp),
      },
    };
  }

  if (formValues.checkType === CheckType.PING) {
    return {
      ...base,
      target: formValues.target,
      settings: {
        ping: getPingSettings(formValues.settings.ping),
      },
    };
  }

  if (formValues.checkType === CheckType.K6) {
    return {
      ...base,
      settings: {
        k6: {
          script: btoa(formValues.settings.k6.script),
        },
      },
    };
  }

  if (formValues.checkType === CheckType.TCP) {
    return {
      ...base,
      settings: {
        tcp: getTcpSettings(formValues.settings.tcp),
      },
    };
  }

  if (formValues.checkType === CheckType.Traceroute) {
    return {
      ...base,
      timeout: 30000,
      frequency: 120000,
      settings: {
        traceroute: getTracerouteSettings(formValues.settings.traceroute),
      },
    };
  }

  throw new Error(`Unknown check type: ${formValues.checkType}`);
};
