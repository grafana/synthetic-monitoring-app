import { reliabilityInboxURL } from './reliabilityInboxRegion';

const suggestions = (host: string) => `https://${host}/api/v1alpha1/reliability-inbox/suggestions`;

describe('reliabilityInboxURL', () => {
  describe('dev', () => {
    it.each([
      ['synthetic-monitoring-api-eu-west-2.grafana-dev.net', 'k6-experiments-dev-eu-west-2.grafana-dev.net'],
      ['synthetic-monitoring-api-us-east-0.grafana-dev.net', 'k6-experiments-dev-us-east-0.grafana-dev.net'],
      [
        'synthetic-monitoring-api-eu-west-6.gcp-europe-west10-0.grafana-dev.net',
        'k6-experiments-dev-eu-west-6.gcp-europe-west10-0.grafana-dev.net',
      ],
      [
        'synthetic-monitoring-api-us-east-3.dev-us-east-3.grafana-dev.net',
        'k6-experiments-dev-us-east-3.dev-us-east-3.grafana-dev.net',
      ],
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
      ['https://synthetic-monitoring-api-us-east-0.grafana.net', 'production is not deployed'],
      ['https://grafana-dev.net', 'no host label'],
      ['https://prometheus-dev-01-dev-us-central-0.grafana-dev.net', 'not the SM API'],
      ['https://synthetic-monitoring-api.grafana-dev.net', 'bare prefix without an override'],
    ])('%s (%s)', (apiHost) => {
      expect(reliabilityInboxURL(apiHost)).toBeUndefined();
    });
  });
});
