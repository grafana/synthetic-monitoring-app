import { SM_DATASOURCE } from 'test/fixtures/datasources';

import { sanitizeName } from 'components/TerraformConfig/terraformConfigUtils';

import { BASIC_PING_CHECK } from './checks';
import { PRIVATE_PROBE, UNSELECTED_PRIVATE_PROBE } from './probes';

export const TERRAFORM_PRIVATE_PROBES = {
  [PRIVATE_PROBE.name]: {
    labels: {
      [PRIVATE_PROBE.labels[0].name]: PRIVATE_PROBE.labels[0].value,
      [PRIVATE_PROBE.labels[1].name]: PRIVATE_PROBE.labels[1].value,
    },
    latitude: PRIVATE_PROBE.latitude,
    longitude: PRIVATE_PROBE.longitude,
    name: PRIVATE_PROBE.name,
    public: PRIVATE_PROBE.public,
    region: PRIVATE_PROBE.region,
    capabilities: PRIVATE_PROBE.capabilities,
  },
  [UNSELECTED_PRIVATE_PROBE.name]: {
    labels: {
      [UNSELECTED_PRIVATE_PROBE.labels[0].name]: UNSELECTED_PRIVATE_PROBE.labels[0].value,
    },
    latitude: UNSELECTED_PRIVATE_PROBE.latitude,
    longitude: UNSELECTED_PRIVATE_PROBE.longitude,
    name: UNSELECTED_PRIVATE_PROBE.name,
    public: UNSELECTED_PRIVATE_PROBE.public,
    region: UNSELECTED_PRIVATE_PROBE.region,
    capabilities: UNSELECTED_PRIVATE_PROBE.capabilities,
  },
};

const nameKey = sanitizeName(`${BASIC_PING_CHECK.job}_${BASIC_PING_CHECK.target}`);

export const TERRAFORM_BASIC_PING_CHECK = {
  provider: {
    grafana: {
      auth: '<GRAFANA_SERVICE_TOKEN>',
      sm_access_token: '<SM_ACCESS_TOKEN>',
      sm_url: SM_DATASOURCE.jsonData.apiHost,
      url: '',
    },
  },
  resource: {
    grafana_synthetic_monitoring_check: {
      [nameKey]: {
        enabled: true,
        job: BASIC_PING_CHECK.job,
        labels: {
          [BASIC_PING_CHECK.labels[0].name]: BASIC_PING_CHECK.labels[0].value,
        },
        probes: BASIC_PING_CHECK.probes,
        settings: {
          ping: {
            dont_fragment: BASIC_PING_CHECK.settings.ping.dontFragment,
            ip_version: BASIC_PING_CHECK.settings.ping.ipVersion,
          },
        },
        target: BASIC_PING_CHECK.target,
      },
    },
    grafana_synthetic_monitoring_probe: TERRAFORM_PRIVATE_PROBES,
  },
  terraform: {
    required_providers: {
      grafana: {
        source: 'grafana/grafana',
      },
    },
  },
};
