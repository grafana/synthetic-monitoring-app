import { config as runtimeConfig } from '@grafana/runtime';

import { Check, Probe } from 'types';
import { useChecks } from 'data/useChecks';
import { useProbes } from 'data/useProbes';
import { checkToTF, probeToTF, sanitizeName } from 'components/TerraformConfig/terraformConfigUtils';
import { TFCheckConfig, TFConfig, TFOutput, TFProbeConfig } from 'components/TerraformConfig/terraformTypes';

import { useSMDS } from './useSMDS';

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
        auth: '<GRAFANA_SERVICE_TOKEN>',
        sm_url: apiHost ?? '<SM_API_URL>',
        sm_access_token: '<SM_ACCESS_TOKEN>',
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

  const checkAlertsCommands = checks
    .filter((check) => check.Alerts && check.Alerts.length > 0)
    .map((check) => {
      return `terraform import grafana_synthetic_monitoring_check_alerts.${sanitizeName(
        `${check.job}_${check.target}`
      )} ${check.id}`;
    });

  const probeCommands = Object.keys(probesConfig).map((probeName) => {
    const probeId = probes.find((probe) => sanitizeName(probe.name) === probeName)?.id;
    return `terraform import grafana_synthetic_monitoring_probe.${probeName} ${probeId}:<PROBE_ACCESS_TOKEN>`;
  });

  return { config, checkCommands, checkAlertsCommands, probeCommands };
}

export function useTerraformConfig() {
  const smDS = useSMDS();
  const { data: probes = [], error: probesError, isLoading: isFetchingProbes } = useProbes();
  const { data: checks = [], error: checksError, isLoading: isFetchingChecks } = useChecks();
  const apiHost = smDS.instanceSettings.jsonData?.apiHost;
  const generated = generateTerraformConfig(probes, checks, apiHost);
  const error = probesError || checksError;
  const isLoading = isFetchingProbes || isFetchingChecks;
  return { ...(generated ?? {}), error, isLoading };
}
