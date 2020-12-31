import { SelectableValue } from '@grafana/data';
import {
  CheckType,
  DnsRecordType,
  DnsProtocol,
  CheckFormValues,
  Settings,
  SettingsFormValues,
  PingSettingsFormValues,
  IpVersion,
  PingSettings,
  HttpSettings,
  HttpMethod,
  HttpSettingsFormValues,
  HttpRegexValidationFormValue,
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
  DnsResponseCodes,
  AlertRule,
  AlertFormValues,
} from 'types';

import {
  CHECK_TYPE_OPTIONS,
  IP_OPTIONS,
  DNS_RESPONSE_CODES,
  HTTP_SSL_OPTIONS,
  HTTP_REGEX_VALIDATION_OPTIONS,
  fallbackCheck,
  TIME_UNIT_OPTIONS,
  ALERTING_SEVERITY_OPTIONS,
} from 'components/constants';
import { checkType, parseAlertTimeUnits } from 'utils';

export function selectableValueFrom<T>(value: T, label?: string): SelectableValue<T> {
  const labelValue = String(value);
  return { label: label ?? labelValue, value };
}

export function fallbackSettings(t: CheckType): Settings {
  switch (t) {
    case CheckType.HTTP: {
      return {
        http: {
          method: HttpMethod.GET,
          ipVersion: IpVersion.V4,
          noFollowRedirects: false,
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
          server: '8.8.8.8',
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
    default:
      throw new Error(`Cannot find values for invalid check type ${t}`);
  }
}

const getPingSettingsFormValues = (settings: Settings): PingSettingsFormValues => {
  const pingSettings = settings.ping ?? (fallbackSettings(CheckType.PING) as PingSettings);
  return {
    ...pingSettings,
    ipVersion: IP_OPTIONS.find(({ value }) => value === settings?.ping?.ipVersion) ?? IP_OPTIONS[1],
  };
};

const headersToLabels = (headers: string[] | undefined): Label[] =>
  headers?.map(header => {
    const parts = header.split(':', 2);
    return {
      name: parts[0],
      value: parts[1],
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
    ...pickedSettings
  } = httpSettings;

  const regexValidations = getHttpRegexValidationFormValues({
    failIfBodyMatchesRegexp,
    failIfBodyNotMatchesRegexp,
    failIfHeaderMatchesRegexp,
    failIfHeaderNotMatchesRegexp,
  });
  return {
    ...pickedSettings,
    followRedirects: !noFollowRedirects,
    sslOptions: getHttpSettingsSslValue(httpSettings.failIfSSL ?? false, httpSettings.failIfNotSSL ?? false),
    validStatusCodes: httpSettings.validStatusCodes?.map(statusCode => selectableValueFrom(statusCode)) ?? [],
    validHTTPVersions: httpSettings.validHTTPVersions?.map(httpVersion => selectableValueFrom(httpVersion)) ?? [],
    method: selectableValueFrom(httpSettings.method),
    ipVersion: selectableValueFrom(httpSettings.ipVersion),
    headers: headersToLabels(httpSettings.headers),
    regexValidations,
  };
};

const getTcpSettingsFormValues = (settings: Settings): TcpSettingsFormValues => {
  const tcpSettings = settings.tcp ?? (fallbackSettings(CheckType.TCP) as TcpSettings);
  return {
    ...tcpSettings,
    ipVersion: selectableValueFrom(tcpSettings.ipVersion),
  };
};

type GetDnsValidationArgs = { [key in ResponseMatchType]: DNSRRValidator | undefined };

const getDnsValidations = (validations: GetDnsValidationArgs): DnsValidationFormValue[] =>
  Object.keys(validations).reduce<DnsValidationFormValue[]>((formValues, validationType) => {
    const responseMatch = validationType as ResponseMatchType;
    validations[responseMatch]?.failIfMatchesRegexp?.forEach(expression => {
      formValues.push({
        expression,
        inverted: false,
        responseMatch: selectableValueFrom(responseMatch),
      });
    });

    validations[responseMatch]?.failIfNotMatchesRegexp?.forEach(expression => {
      formValues.push({
        expression,
        inverted: true,
        responseMatch: selectableValueFrom(responseMatch),
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
        ?.map(responseCode => DNS_RESPONSE_CODES.find(option => option.value === responseCode))
        .filter(Boolean) as Array<SelectableValue<string>>) ?? [],
    validations: getDnsValidations({
      [ResponseMatchType.Answer]: dnsSettings.validateAnswerRRS,
      [ResponseMatchType.Authority]: dnsSettings.validateAuthorityRRS,
      [ResponseMatchType.Additional]: dnsSettings.validateAdditionalRRS,
    }),
  };
};

const getFormSettingsForCheck = (settings: Settings): SettingsFormValues => {
  const type = checkType(settings);
  switch (type) {
    case CheckType.HTTP:
      return { http: getHttpSettingsFormValues(settings) };
    case CheckType.TCP:
      return { tcp: getTcpSettingsFormValues(settings) };
    case CheckType.DNS:
      return { dns: getDnsSettingsFormValues(settings) };
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
  };
};

const getAlertFormValues = (alertRules: AlertRule[]): AlertFormValues[] =>
  alertRules.map(rule => {
    const { timeCount, timeUnit } = parseAlertTimeUnits(rule.for ?? '');
    const timeOption = TIME_UNIT_OPTIONS.find(({ value }) => value === timeUnit) ?? TIME_UNIT_OPTIONS[1];
    const severityLabel = rule.labels?.severity;
    const severity =
      ALERTING_SEVERITY_OPTIONS.find(option => option.value === severityLabel) ?? ALERTING_SEVERITY_OPTIONS[1];

    return {
      name: rule.alert,
      expression: rule.expr,
      timeCount: parseInt(timeCount, 10),
      timeUnit: timeOption,
      annotations: Object.keys(rule.annotations ?? {}).map(annotationName => ({
        name: annotationName,
        value: rule.annotations?.[annotationName] ?? '',
      })),
      labels: Object.keys(rule.labels ?? {}).map(labelName => ({
        name: labelName,
        value: rule.labels?.[labelName] ?? '',
      })),
      severity,
    };
  });

export const getDefaultValuesFromCheck = (
  check: Check = fallbackCheck,
  alertRules: AlertRule[] = []
): CheckFormValues => {
  const defaultCheckType = checkType(check.settings);
  const settings = check.id ? getFormSettingsForCheck(check.settings) : getAllFormSettingsForCheck();
  const alerts = getAlertFormValues(alertRules);

  return {
    ...check,
    timeout: check.timeout / 1000,
    frequency: check.frequency / 1000,
    probes: check.probes,
    checkType:
      CHECK_TYPE_OPTIONS.find(checkTypeOption => checkTypeOption.value === defaultCheckType) ?? CHECK_TYPE_OPTIONS[1],
    settings,
    alerts,
  };
};

function getValueFromSelectable<T>(selectable: SelectableValue<T> | undefined): T | undefined {
  if (!selectable?.value) {
    return undefined;
  }
  return selectable.value;
}

function getValuesFromMultiSelectables<T>(selectables: Array<SelectableValue<T>> | undefined): T[] | undefined {
  return selectables?.map(selectable => getValueFromSelectable(selectable)).filter(Boolean) as T[];
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
  const formattedHeaders = headers?.map(header => `${header.name}:${header.value}`) ?? [];

  const mergedSettings = {
    ...(defaultSettings ?? {}),
    ...settings,
  };
  const method = getValueFromSelectable(settings?.method ?? defaultSettings?.method) ?? fallbackValues.method;

  const sslConfig = getHttpSslOptionsFromFormValue(
    getValueFromSelectable(settings.sslOptions ?? defaultSettings?.sslOptions) ?? HttpSslOption.Ignore
  );

  const validationRegexes = getHttpRegexValidationsFromFormValue(settings.regexValidations ?? []);

  // We need to pick the sslOptions key out of the settings, since the API doesn't expect this key
  const { sslOptions, regexValidations, followRedirects, ...mergedSettingsToKeep } = mergedSettings;

  return {
    ...fallbackValues,
    ...mergedSettingsToKeep,
    ...sslConfig,
    ...validationRegexes,
    noFollowRedirects: !followRedirects,
    method,
    headers: formattedHeaders,
    ipVersion: getValueFromSelectable(settings?.ipVersion ?? defaultSettings?.ipVersion) ?? fallbackValues.ipVersion,
    validStatusCodes: getValuesFromMultiSelectables(settings?.validStatusCodes ?? defaultSettings?.validStatusCodes),
    validHTTPVersions: getValuesFromMultiSelectables(settings?.validHTTPVersions ?? defaultSettings?.validHTTPVersions),
  };
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
  return {
    ...fallbackValues,
    ...mergedSettings,
    ipVersion: getValueFromSelectable(settings?.ipVersion ?? defaultSettings?.ipVersion) ?? fallbackValues.ipVersion,
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

type DnsValidations = Pick<DnsSettings, 'validateAdditionalRRS' | 'validateAnswerRRS' | 'validateAuthorityRRS'>;

const getDnsValidationsFromFormValues = (validations: DnsValidationFormValue[]): DnsValidations =>
  validations.reduce<DnsValidations>(
    (acc, validation) => {
      const destinationName = validation.inverted ? 'failIfNotMatchesRegexp' : 'failIfMatchesRegexp';
      const responseMatch = getValueFromSelectable(validation.responseMatch);
      switch (responseMatch) {
        case ResponseMatchType.Additional:
          acc.validateAdditionalRRS![destinationName].push(validation.expression);
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
      validateAdditionalRRS: {
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

const getSettingsFromFormValues = (formValues: Partial<CheckFormValues>, defaultValues: CheckFormValues): Settings => {
  const checkType = getValueFromSelectable(formValues.checkType ?? defaultValues.checkType);
  switch (checkType) {
    case CheckType.HTTP:
      return { http: getHttpSettings(formValues.settings?.http, defaultValues.settings.http) };
    case CheckType.TCP:
      return { tcp: getTcpSettings(formValues.settings?.tcp, defaultValues.settings.tcp) };
    case CheckType.DNS:
      return { dns: getDnsSettings(formValues.settings?.dns, defaultValues.settings.dns) };
    case CheckType.PING:
      return { ping: getPingSettings(formValues.settings?.ping, defaultValues.settings.ping) };
    default:
      throw new Error(`Check type of ${checkType} is invalid`);
  }
};

export const getCheckFromFormValues = (
  formValues: Omit<CheckFormValues, 'alert'>,
  defaultValues: CheckFormValues
): Check => {
  return {
    job: formValues.job,
    target: formValues.target,
    enabled: formValues.enabled,
    labels: formValues.labels ?? defaultValues.labels ?? [],
    probes: formValues.probes,
    timeout: formValues.timeout * 1000,
    frequency: formValues.frequency * 1000,
    settings: getSettingsFromFormValues(formValues, defaultValues),
  };
};
