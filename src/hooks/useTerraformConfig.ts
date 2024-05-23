import { useContext } from 'react';
import { config as runtimeConfig } from '@grafana/runtime';

import { Check, Probe } from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import { useChecks } from 'data/useChecks';
import { useProbes } from 'data/useProbes';
import { checkToTF, probeToTF, sanitizeName } from 'components/TerraformConfig/terraformConfigUtils';
import { TFCheckConfig, TFConfig, TFOutput, TFProbeConfig } from 'components/TerraformConfig/terraformTypes';

function generateTerraformConfig(probes: Probe[], checks: Check[], apiHost?: string): TFOutput {
  const checksConfig = checks.reduce<TFCheckConfig>((acc, check) => {
    if (check) {
      const checkConfig = checkToTF(check);
      const resourceName = sanitizeName(`${check.job}_${check.target}`);
      if (!acc[resourceName]) {
        acc[resourceName] = checkConfig;
      } else {
        throw new Error(`Cannot generate TF config for checks with duplicate resource names: ${resourceName}`);
      }
    }

    return acc;
  }, {});

  const probesConfig = probes.reduce<TFProbeConfig>((acc, probe) => {
    if (!probe || probe.public) {
      return acc;
    }

    const probeConfig = probeToTF(probe);
    const sanitizedName = sanitizeName(probe.name);
    if (!acc[sanitizedName]) {
      acc[sanitizedName] = probeConfig;
    } else {
      throw new Error(`Cannot generate TF config for probes with duplicate probe names: ${probe.name}`);
    }
    return acc;
  }, {});

  const config: TFConfig = {
    terraform: {
      required_providers: {
        grafana: {
          source: 'grafana/grafana',
        },
      },
    },
    provider: {
      grafana: {
        url: runtimeConfig.appUrl,
        auth: '<add an api key from grafana.com>',
        sm_url: apiHost ?? '<ADD SM API URL>',
        sm_access_token: '<add an sm access token>',
      },
    },
    resource: {},
  };

  if (Object.keys(checksConfig).length > 0) {
    config.resource.grafana_synthetic_monitoring_check = checksConfig;
  }
  if (Object.keys(probesConfig).length > 0) {
    config.resource.grafana_synthetic_monitoring_probe = probesConfig;
  }

  const checkCommands = checks.map((check) => {
    return `terraform import grafana_synthetic_monitoring_check.${sanitizeName(`${check.job}_${check.target}`)} ${
      check.id
    }`;
  });

  const probeCommands = Object.keys(probesConfig).map((probe) => {
    return `terraform import grafana_synthetic_monitoring_probe.${probe} ${probesConfig[probe].id}:<PROBE_AUTH_TOKEN>`;
  });

  return { config, checkCommands, probeCommands };
}

export function useTerraformConfig() {
  const { instance } = useContext(InstanceContext);
  const { data: probes = [], error: probesError } = useProbes();
  const { data: checks = [], error: checksError } = useChecks();
  const apiHost = instance.api?.instanceSettings.jsonData?.apiHost;
  const generated = generateTerraformConfig(probes, checks, apiHost);
  const error = probesError || checksError;

  return { ...(generated ?? {}), error };
}
