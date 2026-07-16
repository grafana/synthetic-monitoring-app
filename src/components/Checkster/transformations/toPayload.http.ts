import {
  CheckFormValuesHttp,
  HTTPCheck,
  HttpRegexValidationFormValue,
  HttpRegexValidationType,
  HttpSettings,
  HttpSettingsFormValues,
  HttpSslOption,
} from 'types';
import { FALLBACK_CHECK_HTTP } from 'components/constants';

import { isSecretRef } from '../utils/secrets';
import { getBasePayloadValuesFromForm, getTlsConfigFromFormValues } from './toPayload.utils';

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

  // Infer the per-check secret-manager flag from the credential fields rather
  // than exposing a toggle: if any field the agent resolves holds a
  // `${secrets.*}` reference, the check opts in to resolution. Computed from the
  // pre-transform form values so the scan sees the literal reference (TLS certs
  // are base64-encoded downstream). Username is excluded — the agent resolves
  // only the basic-auth password. Omitted when false so checks that don't use
  // secrets keep an unchanged payload (the API treats absent as false).
  const secretManagerEnabled =
    isSecretRef(settings.bearerToken) ||
    isSecretRef(settings.basicAuth?.password) ||
    isSecretRef(tlsConfig?.caCert) ||
    isSecretRef(tlsConfig?.clientCert) ||
    isSecretRef(tlsConfig?.clientKey);

  return sanitize({
    ...restToKeep,
    ...sslConfig,
    ...validationRegexes,
    ...transformedTlsConfig,
    ...(secretManagerEnabled ? { secretManagerEnabled: true } : {}),
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
