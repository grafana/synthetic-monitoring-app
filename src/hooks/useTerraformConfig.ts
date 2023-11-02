import { useContext, useEffect, useState } from 'react';
import { config as runtimeConfig } from '@grafana/runtime';

import { GrafanaInstances } from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import { checkToTF, probeToTF,sanitizeName } from 'components/TerraformConfig/terraformConfigUtils';
import { TFCheckConfig, TFConfig, TFOutput,TFProbeConfig } from 'components/TerraformConfig/terraformTypes';

async function generateTerraformConfig(instance: GrafanaInstances): Promise<TFOutput> {
  const checks = await instance.api?.listChecks();
  const probes = await instance.api?.listProbes();
  if (!checks || !probes) {
    throw new Error("Couldn't generate TF config");
  }
  const checksConfig = checks?.reduce<TFCheckConfig>((acc, check) => {
    const checkConfig = checkToTF(check);
    const resourceName = sanitizeName(`${check.job}_${check.target}`);
    if (!acc[resourceName]) {
      acc[resourceName] = checkConfig;
    } else {
      throw new Error(`Cannot generate TF config for checks with duplicate resource names: ${resourceName}`);
    }
    return acc;
  }, {});

  const probesConfig = probes?.reduce<TFProbeConfig>((acc, probe) => {
    if (probe.public) {
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
        sm_url: instance.api?.instanceSettings.jsonData.apiHost ?? '<ADD SM API URL>',
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

  return { config, checkCommands };
}

export function useTerraformConfig() {
  const { instance } = useContext(InstanceContext);
  const [generated, setGenerated] = useState<TFOutput>();
  const [error, setError] = useState('');
  useEffect(() => {
    generateTerraformConfig(instance)
      .then((generated) => {
        setGenerated(generated);
      })
      .catch((e) => {
        setError(e?.message ?? e);
      });
  }, [instance]);
  return { ...(generated ?? {}), error };
}
