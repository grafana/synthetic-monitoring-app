import { Check, Label, MultiHttpSettings, Probe, TLSConfig } from 'types';
import {
  isBrowserCheck,
  isDNSCheck,
  isGRPCCheck,
  isHttpCheck,
  isMultiHttpCheck,
  isPingCheck,
  isScriptedCheck,
  isTCPCheck,
  isTracerouteCheck,
} from 'utils.types';

import { TFCheck, TFCheckSettings, TFLabels, TFMultiHttpEntry, TFProbe, TFTlsConfig } from './terraformTypes';

const labelsToTFLabels = (labels: Label[]): TFLabels =>
  labels.reduce<TFLabels>((acc, label) => {
    acc[label.name] = label.value;
    return acc;
  }, {});

const tlsConfigToTF = (tlsConfig?: TLSConfig): TFTlsConfig | undefined => {
  if (!tlsConfig) {
    return;
  }

  return {
    ca_cert: tlsConfig.caCert,
    client_cert: tlsConfig.clientCert,
    client_key: tlsConfig.clientKey,
    insecure_skip_verify: tlsConfig.insecureSkipVerify,
    server_name: tlsConfig.serverName,
  };
};

const settingsToTF = (check: Check): TFCheckSettings => {
  if (isTCPCheck(check)) {
    return {
      tcp: {
        ip_version: check.settings.tcp.ipVersion,
        tls_config: tlsConfigToTF(check.settings.tcp.tlsConfig),
        tls: check.settings.tcp.tls,
        query_response: check.settings.tcp.queryResponse,
      },
    };
  }

  if (isPingCheck(check)) {
    return {
      ping: {
        ip_version: check.settings.ping.ipVersion,
        dont_fragment: check.settings.ping.dontFragment,
      },
    };
  }

  if (isHttpCheck(check)) {
    return {
      http: {
        method: check.settings.http.method,
        compression: check.settings.http.compression,
        basic_auth: check.settings.http.basicAuth,
        bearer_token: check.settings.http.bearerToken,
        cache_busting_query_param_name: check.settings.http.cacheBustingQueryParamName,
        fail_if_body_matches_regexp: check.settings.http.failIfBodyMatchesRegexp,
        fail_if_body_not_matches_regexp: check.settings.http.failIfBodyNotMatchesRegexp,
        fail_if_header_matches_regexp: check.settings.http.failIfHeaderMatchesRegexp,
        fail_if_header_not_matches_regexp: check.settings.http.failIfHeaderNotMatchesRegexp,
        fail_if_not_ssl: check.settings.http.failIfNotSSL,
        fail_if_ssl: check.settings.http.failIfSSL,
        ip_version: check.settings.http.ipVersion,
        no_follow_redirects: check.settings.http.noFollowRedirects,
        proxy_url: check.settings.http.proxyURL,
        proxy_connect_headers: check.settings.http.proxyConnectHeaders,
        tls_config: tlsConfigToTF(check.settings.http.tlsConfig),
        valid_http_versions: check.settings.http.validHTTPVersions,
        valid_status_codes: check.settings.http.validStatusCodes,
      },
    };
  }

  if (isDNSCheck(check)) {
    return {
      dns: {
        ip_version: check.settings.dns.ipVersion,
        server: check.settings.dns.server,
        port: check.settings.dns.port,
        record_type: check.settings.dns.recordType,
        protocol: check.settings.dns.protocol,
        valid_r_codes: check.settings.dns.validRCodes,
        validate_answer_rrs: {
          fail_if_matches_regexp: check.settings.dns.validateAnswerRRS?.failIfMatchesRegexp,
          fail_if_not_matches_regexp: check.settings.dns.validateAnswerRRS?.failIfNotMatchesRegexp,
        },
        validate_authority_rrs: {
          fail_if_matches_regexp: check.settings.dns.validateAuthorityRRS?.failIfMatchesRegexp,
          fail_if_not_matches_regexp: check.settings.dns.validateAuthorityRRS?.failIfNotMatchesRegexp,
        },
        validate_additional_rrs: {
          fail_if_matches_regexp: check.settings.dns.validateAdditionalRRS?.failIfMatchesRegexp,
          fail_if_not_matches_regexp: check.settings.dns.validateAdditionalRRS?.failIfNotMatchesRegexp,
        },
      },
    };
  }

  if (isTracerouteCheck(check)) {
    return {
      traceroute: {
        max_hops: check.settings.traceroute.maxHops,
        max_unknown_hops: check.settings.traceroute.maxUnknownHops,
        ptr_lookup: check.settings.traceroute.ptrLookup,
      },
    };
  }

  if (isMultiHttpCheck(check)) {
    const escapeString = JSON.stringify(check.settings.multihttp);
    const replaced = escapeString.replace(/\$\{/g, '$$${');
    const escaped = JSON.parse(replaced) as MultiHttpSettings;
    return {
      multihttp: {
        entries: escaped.entries.map((entry) => {
          const { queryFields, ...request } = entry.request;
          const transformed: TFMultiHttpEntry = {
            ...entry,
            request: {
              ...request,
              query_fields: queryFields,
              body: {
                content_type: entry.request.body?.contentType,
              },
            },
          };
          if (entry.request.postData) {
            transformed.request.post_data = {
              mime_type: entry.request.postData.mimeType,
              text: entry.request.postData.text,
            };
          }
          return transformed;
        }),
      },
    };
  }

  if (isScriptedCheck(check)) {
    return {
      scripted: {},
    };
  }

  if (isBrowserCheck(check)) {
    return {
      browser: {},
    };
  }

  // TODO: This need to be verified
  if (isGRPCCheck(check)) {
    return {
      grpc: {
        tls: check.settings.grpc.tls,
        service: check.settings.grpc.service,
        ip_version: check.settings.grpc.ipVersion,
        tls_config: tlsConfigToTF(check.settings.grpc.tlsConfig),
      },
    };
  }

  // @ts-expect-error - This should never happen
  const settingsKey = Object.keys(check.settings)[0];
  throw new Error(`Unknown check type: ${settingsKey}`);
};

export const checkToTF = (check: Check): TFCheck => {
  const tfCheck = {
    job: check.job,
    target: check.target,
    enabled: check.enabled,
    probes: check.probes,
    labels: labelsToTFLabels(check.labels),
    settings: settingsToTF(check),
  };

  return tfCheck;
};

export const sanitizeName = (name: string): string => {
  const regex = new RegExp(/[^A-Za-z0-9_-]/);
  const sanitized = name.split('').map((char) => {
    if (regex.test(char)) {
      return '_';
    }
    return char;
  });
  return sanitized.join('');
};

export const probeToTF = (probe: Probe): TFProbe => ({
  name: probe.name,
  latitude: probe.latitude,
  longitude: probe.longitude,
  region: probe.region,
  public: false,
  labels: labelsToTFLabels(probe.labels),
  ...probe.capabilities,
});
