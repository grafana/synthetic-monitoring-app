import { Check, CheckType, Label, Probe, TLSConfig } from 'types';
import { checkType } from 'utils';
import { TFCheck, TFCheckSettings, TFLabels, TFProbe, TFTlsConfig } from './terraformTypes';

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
  const type = checkType(check.settings);
  switch (type) {
    case CheckType.TCP:
      if (!check.settings.tcp) {
        throw new Error(`could not translate settings to terraform config for check ${check.job}`);
      }
      return {
        tcp: {
          ip_version: check.settings.tcp.ipVersion,
          tls_config: tlsConfigToTF(check.settings.tcp.tlsConfig),
          tls: check.settings.tcp.tls,
          query_response: check.settings.tcp.queryResponse,
        },
      };
    case CheckType.PING:
      if (!check.settings.ping) {
        throw new Error(`could not translate settings to terraform config for check ${check.job}`);
      }
      return {
        ping: {
          ip_version: check.settings.ping.ipVersion,
          dont_fragment: check.settings.ping.dontFragment,
        },
      };
    case CheckType.HTTP:
      if (!check.settings.http) {
        throw new Error(`could not translate settings to terraform config for check ${check.job}`);
      }
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
          tls_config: tlsConfigToTF(check.settings.http.tlsConfig),
          valid_http_versions: check.settings.http.validHTTPVersions,
          valid_status_codes: check.settings.http.validStatusCodes,
        },
      };
    case CheckType.DNS:
      if (!check.settings.dns) {
        throw new Error(`could not translate settings to terraform config for check ${check.job}`);
      }
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
            fail_if_matches_regexp: check.settings.dns.validateAditionalRRS?.failIfMatchesRegexp,
            fail_if_not_matches_regexp: check.settings.dns.validateAditionalRRS?.failIfNotMatchesRegexp,
          },
        },
      };
    case CheckType.Traceroute:
      throw new Error('traceroute checks are not yet supported in the Grafana Terraform provider');
    // if (!check.settings.traceroute) {
    //   throw new Error(`could not translate settings to terraform config for check ${check.job}`);
    // }
    // return {
    //   traceroute: {
    //     max_hops: check.settings.traceroute.maxHops,
    //     max_unknown_hops: check.settings.traceroute.maxUnknownHops,
    //     ptr_lookup: check.settings.traceroute.ptrLookup,
    //   },
    // };
    default:
      throw new Error(`could not translate settings for check to terraform config: ${check.job}`);
  }
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
});
