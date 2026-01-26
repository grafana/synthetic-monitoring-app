import { faro, isError, isObject } from '@grafana/faro-web-sdk';
import { config } from '@grafana/runtime';

export enum FaroEvent {
  Init = 'initialize',
  UpdateCheck = 'update_check',
  BulkUpdateCheck = 'bulk_update_check',
  BulkDeleteCheck = 'bulk_delete_check',
  DeleteCheck = 'delete_check',
  TestCheck = 'test_check',
  CreateCheck = 'create_check',
  CreateProbe = 'create_probe',
  UpdateProbe = 'update_probe',
  DeleteProbe = 'delete_probe',
  ResetProbeToken = 'reset_probe_token',
  DisablePlugin = 'disable_plugin',
  CreateAccessToken = 'create_access_token',
  SaveThresholds = 'save_thresholds',
  ShowTerraformConfig = 'show_terraform_config',
  RefetchTenantLimits = 'refetch_tenant_limits',
  InitializeAccessToken = 'initialize_access_token',
  UpdateCheckAlerts = 'update_check_alerts',
  NoProbeMappingFound = 'no_probe_mapping_found',
}

export enum FaroEnv {
  Dev = 'development',
  Staging = 'staging',
  Prod = 'production',
}

export type FaroEventMeta = {
  type: FaroEvent;
  info?: Record<string, string>;
};

export function isFaroEventMeta(event?: unknown): event is FaroEventMeta {
  if (!event) {
    return false;
  }

  return typeof event === 'object' && 'type' in event;
}

export function pushFaroCount(type: string, count: number) {
  try {
    faro.api?.pushMeasurement({ type, values: { count } });
  } catch (e) {}
}

export function reportEvent(type: FaroEvent, info: Record<string, string> = {}) {
  const attributes = {
    ...info,
    slug: config.bootData.user.orgName,
  };

  try {
    faro.api?.pushEvent(type, attributes);
  } catch (e) {
    console.error(`Failed to report event: ${type}`, e);
  }
}

function sanitizeError(error: Error | Object | string) {
  if (isError(error)) {
    return error;
  }
  if (isObject(error)) {
    return new Error(JSON.stringify(error));
  }
  return new Error(error);
}

export function reportError(error: Error | Object | string, type?: FaroEvent) {
  const valToSend = sanitizeError(error);
  try {
    faro.api.pushError(valToSend, { type });
  } catch (e) {}
}

function getFaroEnv(): FaroEnv {
  const appUrl = new URL(config.appUrl).hostname;
  switch (true) {
    case appUrl.endsWith('grafana-ops.net'):
      return FaroEnv.Staging;
    case appUrl.endsWith('grafana.net'):
      return FaroEnv.Prod;
    case appUrl.endsWith('grafana-dev.net'):
    case appUrl.endsWith('localhost'):
    default:
      return FaroEnv.Dev;
  }
}

export function getFaroConfig() {
  const env = getFaroEnv();
  switch (env) {
    case FaroEnv.Dev:
      return {
        url: 'https://faro-collector-ops-us-east-0.grafana-ops.net/collect/769f675a8e1e8b05f05b478b7002259b',
        name: 'synthetic-monitoring-app-dev',
        env: FaroEnv.Dev,
      };
    case FaroEnv.Staging:
      return {
        url: 'https://faro-collector-ops-us-east-0.grafana-ops.net/collect/73212b0adc2a3d002ee3befa3b48c4d9',
        name: 'synthetic-monitoring-app-staging',
        env: FaroEnv.Staging,
      };
    case FaroEnv.Prod:
    default:
      return {
        url: 'https://faro-collector-ops-us-east-0.grafana-ops.net/collect/837791054a26c6aba5d32ece9030be32',
        name: 'synthetic-monitoring-app-prod',
        env: FaroEnv.Prod,
      };
  }
}
