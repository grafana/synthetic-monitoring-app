import {
  CheckFormValuesHttp,
  CheckType,
  HeaderMatch,
  HTTPCheck,
  HttpRegexValidationFormValue,
  HttpRegexValidationType,
  HttpSettings,
  HttpSettingsFormValues,
  HttpSslOption,
  Label,
} from 'types';
import {
  getBaseFormValuesFromCheck,
  getTlsConfigFormValues,
  predefinedAlertsToFormValues,
} from 'components/CheckEditor/transformations/toFormValues.utils';
import { HTTP_PREDEFINED_ALERTS } from 'components/CheckForm/AlertsPerCheck/AlertsPerCheck.constants';
import { FALLBACK_CHECK_HTTP, HTTP_COMPRESSION_ALGO_OPTIONS } from 'components/constants';

export function getHTTPCheckFormValues(check: HTTPCheck): CheckFormValuesHttp {
  const base = getBaseFormValuesFromCheck(check);

  return {
    ...base,
    checkType: CheckType.HTTP,
    settings: {
      http: getHttpSettingsForm(check.settings),
    },
    alerts: {
      ...base.alerts,
      ...predefinedAlertsToFormValues(HTTP_PREDEFINED_ALERTS, check.alerts || []),
    },
  };
}

export function getHttpSettingsForm(settings: HTTPCheck['settings']): HttpSettingsFormValues {
  const httpSettings = settings.http ?? FALLBACK_CHECK_HTTP.settings.http;
  const {
    failIfBodyMatchesRegexp,
    failIfBodyNotMatchesRegexp,
    failIfHeaderMatchesRegexp,
    failIfHeaderNotMatchesRegexp,
    noFollowRedirects,
    tlsConfig,
    compression,
    ...rest
  } = httpSettings;

  const regexValidations = getHttpRegexValidationFormValues({
    failIfBodyMatchesRegexp,
    failIfBodyNotMatchesRegexp,
    failIfHeaderMatchesRegexp,
    failIfHeaderNotMatchesRegexp,
  });

  const transformedTlsConfig = getTlsConfigFormValues(tlsConfig);

  return {
    ...rest,
    ...transformedTlsConfig,
    followRedirects: !noFollowRedirects,
    sslOptions: getHttpSettingsSslValue(httpSettings.failIfSSL ?? false, httpSettings.failIfNotSSL ?? false),
    validStatusCodes: httpSettings.validStatusCodes ?? [],
    validHTTPVersions: httpSettings.validHTTPVersions ?? [],
    headers: headersToLabels(httpSettings.headers || []),
    proxyConnectHeaders: headersToLabels(httpSettings.proxyConnectHeaders || []),
    regexValidations,
    compression: compression ? compression : HTTP_COMPRESSION_ALGO_OPTIONS[0].value,
  };
}

const headersToLabels = (headers: string[]): Label[] =>
  headers.map((header) => {
    const parts = header.split(':');
    const value = parts.slice(1).join(':');
    return {
      name: parts[0],
      value: value,
    };
  });

type HttpSettingsValidations = Pick<
  HttpSettings,
  | 'failIfBodyMatchesRegexp'
  | 'failIfBodyNotMatchesRegexp'
  | 'failIfHeaderMatchesRegexp'
  | 'failIfHeaderNotMatchesRegexp'
>;

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
          matchType: HttpRegexValidationType.Body,
          expression: validation as string,
          inverted: invertedTypes.has(regexType),
        });
      } else if (headerRegexes.has(regexType)) {
        const headerMatch = validation as HeaderMatch;
        validationFormValues.push({
          matchType: HttpRegexValidationType.Header,
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

const getHttpSettingsSslValue = (failIfSSL: boolean, failIfNotSSL: boolean): HttpSslOption => {
  if (failIfSSL && !failIfNotSSL) {
    return HttpSslOption.FailIfPresent;
  }

  if (!failIfSSL && failIfNotSSL) {
    return HttpSslOption.FailIfNotPresent;
  }

  return HttpSslOption.Ignore;
};
