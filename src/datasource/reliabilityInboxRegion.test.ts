import { reliabilityInboxURL } from './reliabilityInboxRegion';

const suggestions = (host: string) => `https://${host}/api/v1alpha1/reliability-inbox/suggestions`;

/**
 * Expectations generated from the deployment_tools libraries that produce the real
 * hostnames, not written by hand:
 *
 *   jsonnet -J ksonnet/vendor -J ksonnet/lib -e "
 *     local mc = import 'meta/clusters.libsonnet';
 *     local sm = import 'synthetic-monitoring/hostnames.libsonnet';
 *     { [sm.forCluster(mc.for_name(n)).http_api_hostname]:
 *         'k6-experiments-%s.%s' % [n, mc.for_name(n).grafana_dns_suffix] for n in names }"
 */
describe('reliabilityInboxURL', () => {
  describe('dev', () => {
    it.each([
      ['synthetic-monitoring-api-eu-west-2.grafana-dev.net', 'k6-experiments-dev-eu-west-2.grafana-dev.net'],
      ['synthetic-monitoring-api-us-east-0.grafana-dev.net', 'k6-experiments-dev-us-east-0.grafana-dev.net'],
      // Compound regional subdomains must be carried through untouched.
      [
        'synthetic-monitoring-api-eu-west-6.gcp-europe-west10-0.grafana-dev.net',
        'k6-experiments-dev-eu-west-6.gcp-europe-west10-0.grafana-dev.net',
      ],
      [
        'synthetic-monitoring-api-us-east-3.dev-us-east-3.grafana-dev.net',
        'k6-experiments-dev-us-east-3.dev-us-east-3.grafana-dev.net',
      ],
      // Legacy override: SM publishes '-dev', the cluster is dev-us-central-0.
      ['synthetic-monitoring-api-dev.grafana-dev.net', 'k6-experiments-dev-us-central-0.grafana-dev.net'],
    ])('%s', (apiHost, expected) => {
      expect(reliabilityInboxURL(`https://${apiHost}`)).toBe(suggestions(expected));
    });
  });

  describe('ops', () => {
    it('derives the ops instance', () => {
      expect(reliabilityInboxURL('https://synthetic-monitoring-api-eu-south-0.grafana-ops.net')).toBe(
        suggestions('k6-experiments-ops-eu-south-0.grafana-ops.net')
      );
    });
  });

  describe('prod', () => {
    // Prod is derived correctly but not yet deployed, so the feature must stay
    // unavailable. When the prod clusters land, add 'prod' to DEPLOYED_ENVIRONMENTS
    // and move these cases into the positive block below.
    it.each([
      'synthetic-monitoring-api-us-east-0.grafana.net',
      'synthetic-monitoring-api.grafana.net',
      'synthetic-monitoring-api-au-southeast.grafana.net',
      'synthetic-monitoring-api-eu-west.grafana.net',
      'synthetic-monitoring-api-gb-south.grafana.net',
    ])('%s is unavailable until prod is deployed', (apiHost) => {
      expect(reliabilityInboxURL(`https://${apiHost}`)).toBeUndefined();
    });
  });

  describe('formatting tolerance', () => {
    it.each([
      'synthetic-monitoring-api-dev.grafana-dev.net',
      'synthetic-monitoring-api-dev.grafana-dev.net/',
      'https://synthetic-monitoring-api-dev.grafana-dev.net',
      'HTTPS://Synthetic-Monitoring-API-DEV.grafana-dev.net',
      '  https://synthetic-monitoring-api-dev.grafana-dev.net  ',
    ])('%s', (apiHost) => {
      expect(reliabilityInboxURL(apiHost)).toBe(suggestions('k6-experiments-dev-us-central-0.grafana-dev.net'));
    });
  });

  describe('fails closed', () => {
    it.each([
      ['', 'empty'],
      ['not a url', 'garbage'],
      ['https://example.com', 'unknown domain'],
      ['https://grafana-dev.net', 'no host label'],
      // A host on a known domain that is not the SM API must not be transformed.
      ['https://prometheus-dev-01-dev-us-central-0.grafana-dev.net', 'not the SM API'],
      // Bare prefix on dev has no override, so there is no region to build from.
      ['https://synthetic-monitoring-api.grafana-dev.net', 'bare prefix without an override'],
    ])('%s (%s)', (apiHost) => {
      expect(reliabilityInboxURL(apiHost)).toBeUndefined();
    });
  });
});
