import { SelectableValue } from '@grafana/data';
import {
  CheckType,
  CheckFormValues,
  Settings,
  SettingsFormValues,
  PingSettingsFormValues,
  PingSettings,
  HttpSettings,
  HttpSettingsFormValues,
  HttpRegexValidationFormValue,
  MultiHttpSettings,
  MultiHttpSettingsFormValues,
  Label,
  TcpSettingsFormValues,
  TcpSettings,
  DnsSettingsFormValues,
  DnsSettings,
  DNSRRValidator,
  DnsValidationFormValue,
  ResponseMatchType,
  Check,
  HttpSslOption,
  HttpRegexValidationType,
  HeaderMatch,
  AlertSensitivity,
  TCPQueryResponse,
  TLSConfig,
  TracerouteSettings,
  TracerouteSettingsFormValues,
  MultiHttpAssertionType,
} from 'types';

import {
  CHECK_TYPE_OPTIONS,
  IP_OPTIONS,
  DNS_RESPONSE_CODES,
  HTTP_SSL_OPTIONS,
  HTTP_REGEX_VALIDATION_OPTIONS,
  ALERT_SENSITIVITY_OPTIONS,
  HTTP_COMPRESSION_ALGO_OPTIONS,
  DNS_RESPONSE_MATCH_OPTIONS,
  fallbackSettings,
  METHOD_OPTIONS,
  MULTI_HTTP_VARIABLE_TYPE_OPTIONS,
  MULTI_HTTP_ASSERTION_TYPE_OPTIONS,
  ASSERTION_SUBJECT_OPTIONS,
  ASSERTION_CONDITION_OPTIONS,
} from 'components/constants';
import { checkType as getCheckType, fromBase64, toBase64 } from 'utils';
import isBase64 from 'is-base64';
import { MultiHttpRequestBody } from 'components/MultiHttp/MultiHttpTypes';

export const ensureBase64 = (value: string) => (isBase64(value, { paddingRequired: true }) ? value : toBase64(value));

export function selectableValueFrom<T>(value: T, label?: string): SelectableValue<T> {
  const labelValue = String(value);
  return { label: label ?? labelValue, value };
}
const getPingSettingsFormValues = (settings: Settings): PingSettingsFormValues => {
  const pingSettings = settings.ping ?? (fallbackSettings(CheckType.PING) as PingSettings);
  return {
    ...pingSettings,
    ipVersion: IP_OPTIONS.find(({ value }) => value === settings?.ping?.ipVersion) ?? IP_OPTIONS[1],
  };
};

const headersToLabels = (headers: string[] | undefined): Label[] =>
  headers?.map((header) => {
    const parts = header.split(':');
    const value = parts.slice(1).join(':');
    return {
      name: parts[0],
      value: value,
    };
  }) ?? [];

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

const getHttpSettingsFormValues = (settings: Settings): HttpSettingsFormValues => {
  const httpSettings = settings.http ?? (fallbackSettings(CheckType.HTTP) as HttpSettings);
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
    headers: headersToLabels(httpSettings.headers),
    proxyConnectHeaders: headersToLabels(httpSettings.proxyConnectHeaders),
    regexValidations,
    compression: compression ? selectableValueFrom(compression) : HTTP_COMPRESSION_ALGO_OPTIONS[0],
  };
};

const getTcpQueryResponseFormValues = (queryResponses?: TCPQueryResponse[]) => {
  if (!queryResponses) {
    return undefined;
  }
  return queryResponses.map(({ send, expect, startTLS }) => ({
    startTLS,
    send: fromBase64(send),
    expect: fromBase64(expect),
  }));
};

const getTcpSettingsFormValues = (settings: Settings): TcpSettingsFormValues => {
  const tcpSettings = settings.tcp ?? (fallbackSettings(CheckType.TCP) as TcpSettings);
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

const getDnsSettingsFormValues = (settings: Settings): DnsSettingsFormValues => {
  const dnsSettings = settings.dns ?? (fallbackSettings(CheckType.DNS) as DnsSettings);
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

const getTracerouteSettingsFormValues = (settings: Settings): TracerouteSettingsFormValues => {
  const tracerouteSettings = settings.traceroute ?? (fallbackSettings(CheckType.Traceroute) as TracerouteSettings);

  return {
    maxHops: String(tracerouteSettings.maxHops),
    ptrLookup: tracerouteSettings.ptrLookup,
    maxUnknownHops: String(tracerouteSettings.maxUnknownHops),
  };
};

const getFormSettingsForCheck = (settings: Settings): SettingsFormValues => {
  const type = getCheckType(settings);
  switch (type) {
    case CheckType.HTTP:
      return { http: getHttpSettingsFormValues(settings) };
    case CheckType.TCP:
      return { tcp: getTcpSettingsFormValues(settings) };
    case CheckType.DNS:
      return { dns: getDnsSettingsFormValues(settings) };
    case CheckType.Traceroute:
      return { traceroute: getTracerouteSettingsFormValues(settings) };
    case CheckType.MULTI_HTTP:
      return { multihttp: getMultiHttpFormValues(settings) };
    case CheckType.PING:
    default:
      return { ping: getPingSettingsFormValues(settings) };
  }
};

const getAllFormSettingsForCheck = (): SettingsFormValues => {
  return {
    http: getHttpSettingsFormValues(fallbackSettings(CheckType.HTTP)),
    tcp: getTcpSettingsFormValues(fallbackSettings(CheckType.TCP)),
    dns: getDnsSettingsFormValues(fallbackSettings(CheckType.DNS)),
    ping: getPingSettingsFormValues(fallbackSettings(CheckType.PING)),
    traceroute: getTracerouteSettingsFormValues(fallbackSettings(CheckType.Traceroute)),
    multihttp: getMultiHttpFormValues(fallbackSettings(CheckType.MULTI_HTTP)),
  };
};

const getAlertSensitivityValueFromCheck = (sensitivity: string): SelectableValue<string> => {
  const found = ALERT_SENSITIVITY_OPTIONS.find(({ value }) => value === sensitivity);
  // We have a custom sensitivity value
  if (sensitivity && !found) {
    return {
      value: sensitivity,
      label: sensitivity,
    };
  }
  if (found) {
    return found;
  }
  return ALERT_SENSITIVITY_OPTIONS[0];
};

export const getDefaultValuesFromCheck = (check: Check): CheckFormValues => {
  const defaultCheckType = getCheckType(check.settings);
  const settings = check.id ? getFormSettingsForCheck(check.settings) : getAllFormSettingsForCheck();

  return {
    ...check,
    publishAdvancedMetrics: !check.basicMetricsOnly,
    timeout: check.timeout / 1000,
    frequency: check.frequency / 1000,
    probes: check.probes,
    alertSensitivity: getAlertSensitivityValueFromCheck(check.alertSensitivity),
    checkType:
      CHECK_TYPE_OPTIONS.find((checkTypeOption) => checkTypeOption.value === defaultCheckType) ?? CHECK_TYPE_OPTIONS[1],
    settings,
  };
};

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
      clientCert: ensureBase64(tlsConfig.clientCert),
      caCert: ensureBase64(tlsConfig.caCert),
      clientKey: ensureBase64(tlsConfig.clientKey),
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

const getHttpSettings = (
  settings: Partial<HttpSettingsFormValues> | undefined = {},
  defaultSettings: HttpSettingsFormValues | undefined
): HttpSettings => {
  const fallbackValues = fallbackSettings(CheckType.HTTP).http as HttpSettings;
  const headers = settings.headers ?? defaultSettings?.headers;
  const formattedHeaders = headers?.map((header) => `${header.name}:${header.value}`) ?? [];
  const proxyHeaders = settings.proxyConnectHeaders ?? defaultSettings?.proxyConnectHeaders;
  const formattedProxyHeaders = proxyHeaders?.map((header) => `${header.name}:${header.value}`) ?? [];

  const mergedSettings = {
    ...(defaultSettings ?? {}),
    ...settings,
  };
  const method = getValueFromSelectable(settings?.method ?? defaultSettings?.method) ?? fallbackValues.method;

  const sslConfig = getHttpSslOptionsFromFormValue(
    getValueFromSelectable(settings.sslOptions ?? defaultSettings?.sslOptions) ?? HttpSslOption.Ignore
  );

  const compression = getValueFromSelectable(settings.compression);

  const validationRegexes = getHttpRegexValidationsFromFormValue(settings.regexValidations ?? []);

  // We need to pick the sslOptions key out of the settings, since the API doesn't expect this key
  const { sslOptions, regexValidations, followRedirects, tlsConfig, ...mergedSettingsToKeep } = mergedSettings;

  const transformedTlsConfig = getTlsConfigFromFormValues(tlsConfig);

  return {
    ...fallbackValues,
    ...mergedSettingsToKeep,
    ...sslConfig,
    ...validationRegexes,
    ...transformedTlsConfig,
    noFollowRedirects: !followRedirects,
    method,
    headers: formattedHeaders,
    proxyConnectHeaders: formattedProxyHeaders,
    ipVersion: getValueFromSelectable(settings?.ipVersion ?? defaultSettings?.ipVersion) ?? fallbackValues.ipVersion,
    validStatusCodes: getValuesFromMultiSelectables(settings?.validStatusCodes ?? defaultSettings?.validStatusCodes),
    validHTTPVersions: getValuesFromMultiSelectables(settings?.validHTTPVersions ?? defaultSettings?.validHTTPVersions),
    compression,
  };
};

const getMultiHttpSettings = (
  settings: MultiHttpSettingsFormValues | undefined,
  defaultSettings: MultiHttpSettingsFormValues | undefined
): MultiHttpSettings => {
  if (!settings) {
    return fallbackSettings(CheckType.MULTI_HTTP) as MultiHttpSettings;
  }

  return {
    entries: settings.entries?.map((entry, index) => {
      const variables = entry.variables ?? defaultSettings?.entries[index]?.variables ?? [];
      const checks = entry.checks ?? defaultSettings?.entries[index]?.checks ?? [];
      const includeBody =
        entry.request.body?.contentEncoding || entry.request.body?.contentType || entry.request.body?.payload;
      const body = includeBody
        ? ({ ...entry.request.body, payload: toBase64(entry.request.body?.payload ?? '') } as MultiHttpRequestBody)
        : undefined;
      return {
        ...defaultSettings?.entries[index],
        ...entry,
        request: {
          ...defaultSettings?.entries[index]?.request,
          ...entry.request,
          body,
          method: getValueFromSelectable(entry.request.method) ?? 'GET',
        },
        variables: variables?.map((variable) => {
          if (variable.type.value === undefined) {
            throw new Error('Selecting a variable type is required');
          }
          return {
            ...variable,
            type: variable.type.value,
          };
        }),
        checks:
          checks.map(({ type, subject, condition, value, expression }) => {
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

const getMultiHttpFormValues = (settings: Settings): MultiHttpSettingsFormValues => {
  const multiHttpSettings = settings.multihttp ?? (fallbackSettings(CheckType.MULTI_HTTP) as MultiHttpSettings);

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

const getTcpQueryResponseFromFormFields = (queryResponses?: TCPQueryResponse[]) => {
  if (!queryResponses) {
    return undefined;
  }
  return queryResponses.map(({ send, expect, startTLS }) => {
    return {
      startTLS,
      send: toBase64(send),
      expect: toBase64(expect),
    };
  });
};

const getTcpSettings = (
  settings: Partial<TcpSettingsFormValues> | undefined,
  defaultSettings: TcpSettingsFormValues | undefined
): TcpSettings => {
  const fallbackValues = fallbackSettings(CheckType.TCP).tcp as TcpSettings;
  const mergedSettings = {
    ...(defaultSettings ?? {}),
    ...settings,
  };

  const tlsConfig = getTlsConfigFromFormValues(mergedSettings.tlsConfig);
  const queryResponse = getTcpQueryResponseFromFormFields(settings?.queryResponse);
  return {
    ...fallbackValues,
    ...mergedSettings,
    ...tlsConfig,
    ipVersion: getValueFromSelectable(settings?.ipVersion ?? defaultSettings?.ipVersion) ?? fallbackValues.ipVersion,
    queryResponse,
  };
};

const getPingSettings = (
  settings: Partial<PingSettingsFormValues> | undefined = {},
  defaultSettings: PingSettingsFormValues | undefined
): PingSettings => {
  const fallbackValues = fallbackSettings(CheckType.PING).ping as PingSettings;
  const mergedSettings = {
    ...(defaultSettings || {}),
    ...settings,
  };
  return {
    ...fallbackValues,
    ...mergedSettings,
    ipVersion: getValueFromSelectable(settings.ipVersion ?? defaultSettings?.ipVersion) ?? fallbackValues.ipVersion,
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

const getDnsSettings = (
  settings: Partial<DnsSettingsFormValues> | undefined,
  defaultSettings: DnsSettingsFormValues | undefined
): DnsSettings => {
  const fallbackValues = fallbackSettings(CheckType.DNS).dns as DnsSettings;
  const validations = getDnsValidationsFromFormValues(settings?.validations ?? defaultSettings?.validations ?? []);
  return {
    recordType:
      getValueFromSelectable(settings?.recordType ?? defaultSettings?.recordType) ?? fallbackValues.recordType,
    server: settings?.server ?? defaultSettings?.server ?? fallbackValues.server,
    ipVersion: getValueFromSelectable(settings?.ipVersion ?? defaultSettings?.ipVersion) ?? fallbackValues.ipVersion,
    protocol: getValueFromSelectable(settings?.protocol ?? defaultSettings?.protocol) ?? fallbackValues.protocol,
    port: Number(settings?.port ?? defaultSettings?.port ?? fallbackValues.port),
    validRCodes:
      getValuesFromMultiSelectables(settings?.validRCodes ?? defaultSettings?.validRCodes) ??
      fallbackValues.validRCodes,
    ...validations,
  };
};

const getTracerouteSettings = (
  settings: TracerouteSettingsFormValues | undefined,
  defaultSettings: TracerouteSettingsFormValues | undefined
): TracerouteSettings => {
  const fallbackValues = fallbackSettings(CheckType.Traceroute).traceroute as TracerouteSettings;
  const updatedSettings = settings ?? defaultSettings ?? fallbackValues;
  return {
    maxHops: parseInt(String(updatedSettings.maxHops), 10),
    ptrLookup: updatedSettings.ptrLookup,
    maxUnknownHops: parseInt(String(updatedSettings.maxUnknownHops), 10),
  };
};

const getSettingsFromFormValues = (
  formValues: Partial<CheckFormValues>,
  defaultValues: CheckFormValues,
  checkType: CheckType
): Settings => {
  switch (checkType) {
    case CheckType.HTTP:
      return { http: getHttpSettings(formValues.settings?.http, defaultValues.settings.http) };
    case CheckType.MULTI_HTTP:
      return { multihttp: getMultiHttpSettings(formValues.settings?.multihttp, defaultValues.settings.multihttp) };
    case CheckType.TCP:
      return { tcp: getTcpSettings(formValues.settings?.tcp, defaultValues.settings.tcp) };
    case CheckType.DNS:
      return { dns: getDnsSettings(formValues.settings?.dns, defaultValues.settings.dns) };
    case CheckType.PING:
      return { ping: getPingSettings(formValues.settings?.ping, defaultValues.settings.ping) };
    case CheckType.Traceroute:
      return {
        traceroute: {
          ...getTracerouteSettings(formValues.settings?.traceroute, defaultValues.settings.traceroute),
        },
      };
    default:
      throw new Error(`Check type of ${checkType} is invalid`);
  }
};

const getTimeoutFromFormValue = (timeout: number, checkType?: CheckType): number => {
  if (checkType === CheckType.Traceroute) {
    return 30000;
  }
  return timeout * 1000;
};

const getTargetFromFormValue = (target: string, formValues: Partial<CheckFormValues>, checkType?: CheckType) => {
  if (checkType === CheckType.MULTI_HTTP) {
    const pluckedTarget = formValues?.settings?.multihttp?.entries[0].request.url;
    if (target === '' || target !== pluckedTarget) {
      return pluckedTarget;
    }
  }
  return target;
};

const getFrequencyFromFormValue = (frequency: number, checkType?: CheckType): number => {
  if (checkType === CheckType.Traceroute) {
    return 120000;
  }
  return frequency * 1000;
};

export const getCheckFromFormValues = (
  formValues: Omit<CheckFormValues, 'alert'>,
  defaultValues: CheckFormValues,
  checkType: CheckType
): Check => {
  return {
    job: formValues.job,
    target: getTargetFromFormValue(formValues.target, formValues, checkType) ?? '',
    enabled: formValues.enabled,
    labels: formValues.labels ?? [],
    probes: formValues.probes,
    timeout: getTimeoutFromFormValue(formValues.timeout, checkType),
    frequency: getFrequencyFromFormValue(formValues.frequency, checkType),
    alertSensitivity: getValueFromSelectable(formValues.alertSensitivity) ?? AlertSensitivity.None,
    settings: getSettingsFromFormValues(formValues, defaultValues, checkType),
    basicMetricsOnly: !formValues.publishAdvancedMetrics,
  };
};

export function checkTypeParamToCheckType(checkType?: string): CheckType {
  switch (checkType) {
    case CheckType.DNS:
      return CheckType.DNS;
    case CheckType.HTTP:
      return CheckType.HTTP;
    case CheckType.Traceroute:
      return CheckType.Traceroute;
    case CheckType.TCP:
      return CheckType.TCP;
    default:
      return CheckType.PING;
  }
}
