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
  Label,
  TcpSettingsFormValues,
  TcpSettings,
  DnsSettingsFormValues,
  DnsSettings,
  DNSRRValidator,
  DnsValidationFormValue,
  ResponseMatchType,
  Check,
} from 'types';

import { CHECK_TYPE_OPTIONS, IP_OPTIONS, DNS_RESPONSE_CODES } from 'components/constants';
import { checkType } from 'utils';

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

const getHttpSettingsFormValues = (settings: Settings): HttpSettingsFormValues => {
  const httpSettings = settings.http ?? (fallbackSettings(CheckType.HTTP) as HttpSettings);
  return {
    ...httpSettings,
    validStatusCodes: httpSettings.validStatusCodes?.map(statusCode => selectableValueFrom(statusCode)) ?? [],
    validHTTPVersions: httpSettings.validHTTPVersions?.map(httpVersion => selectableValueFrom(httpVersion)) ?? [],
    method: selectableValueFrom(httpSettings.method),
    ipVersion: selectableValueFrom(httpSettings.ipVersion),
    headers: headersToLabels(httpSettings.headers),
  };
};

const getTcpSettingsFormValues = (settings: Settings): TcpSettingsFormValues => {
  const tcpSettings = settings.tcp ?? (fallbackSettings(CheckType.TCP) as TcpSettings);
  return {
    ...tcpSettings,
    ipVersion: selectableValueFrom(tcpSettings.ipVersion),
  };
};

interface GetDnsValidationArgs {
  [ResponseMatchType.Answer]?: DNSRRValidator;
  [ResponseMatchType.Authority]?: DNSRRValidator;
  [ResponseMatchType.Additional]?: DNSRRValidator;
}

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

export const getDefaultValuesFromCheck = (check: Check): CheckFormValues => {
  const defaultCheckType = checkType(check.settings);
  return {
    ...check,
    timeout: check.timeout / 1000,
    frequency: check.frequency / 1000,
    probes: check.probes,
    checkType:
      CHECK_TYPE_OPTIONS.find(checkTypeOption => checkTypeOption.value === defaultCheckType) ?? CHECK_TYPE_OPTIONS[1],
    settings: getFormSettingsForCheck(check.settings),
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

  return {
    ...fallbackValues,
    ...mergedSettings,
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

export const getCheckFromFormValues = (formValues: CheckFormValues, defaultValues: CheckFormValues): Check => {
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
