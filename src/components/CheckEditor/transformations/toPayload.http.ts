import {
  CheckFormValuesHttp,
  HTTPCheck,
  HttpRegexValidationFormValue,
  HttpRegexValidationType,
  HttpSettings,
  HttpSettingsFormValues,
  HttpSslOption,
} from 'types';
import {
  getBasePayloadValuesFromForm,
  getTlsConfigFromFormValues,
} from 'components/CheckEditor/transformations/toPayload.utils';
import { FALLBACK_CHECK_HTTP } from 'components/constants';

export function getHTTPPayload(formValues: CheckFormValuesHttp): HTTPCheck {
  const base = getBasePayloadValuesFromForm(formValues);

  return {
    ...base,
    settings: {
      http: getHttpSettingsPayload(formValues.settings.http),
    },
  };
}

function getHttpSettingsPayload(settings: Partial<HttpSettingsFormValues> | undefined = {}): HttpSettings {
  const headers = settings.headers ?? [];
  const formattedHeaders = headers?.map((header) => `${header.name}:${header.value}`) ?? [];
  const proxyHeaders = settings.proxyConnectHeaders ?? [];
  const formattedProxyHeaders = proxyHeaders?.map((header) => `${header.name}:${header.value}`) ?? [];
  const sslConfig = getHttpSslOptionsFromFormValue(settings.sslOptions);
  const compression = settings.compression;
  const validationRegexes = getHttpRegexValidationsFromFormValue(settings.regexValidations ?? []);

  // We need to pick the sslOptions key out of the settings, since the API doesn't expect this key
  const { sslOptions, regexValidations, followRedirects, tlsConfig, ...restToKeep } = settings;
  const transformedTlsConfig = getTlsConfigFromFormValues(tlsConfig);

  return sanitize({
    ...restToKeep,
    ...sslConfig,
    ...validationRegexes,
    ...transformedTlsConfig,
    noFollowRedirects: !followRedirects,
    method: settings?.method ?? FALLBACK_CHECK_HTTP.settings.http.method,
    headers: formattedHeaders,
    proxyConnectHeaders: formattedProxyHeaders,
    ipVersion: settings?.ipVersion ?? FALLBACK_CHECK_HTTP.settings.http.ipVersion,
    validStatusCodes: settings.validStatusCodes,
    validHTTPVersions: settings?.validHTTPVersions,
    compression,
  });
}

const getHttpSslOptionsFromFormValue = (
  sslOption?: HttpSslOption
): Pick<HttpSettings, 'failIfSSL' | 'failIfNotSSL'> => {
  if (sslOption === undefined) {
    return {
      failIfNotSSL: false,
      failIfSSL: false,
    };
  }

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
      switch (validation.matchType) {
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

function isBasicAuthEmpty(basicAuth: HttpSettingsFormValues['basicAuth']) {
  return !basicAuth?.username && !basicAuth?.password;
}

function sanitize(settings: HttpSettings): HttpSettings {
  const { bearerToken, basicAuth, ...rest } = settings;

  return {
    ...rest,
    basicAuth: isBasicAuthEmpty(basicAuth) ? undefined : basicAuth,
    bearerToken: settings.bearerToken || undefined,
  };
}
