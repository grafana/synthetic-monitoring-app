import { faro, isError } from '@grafana/faro-web-sdk';
import { config } from '@grafana/runtime';

export enum FaroEvent {
  Init = 'initialize',
  AutoInit = 'synthetics_auto_initialized',
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
  CreateAccessToken = 'create_access_token',
  DeleteAccessToken = 'delete_access_token',
  SaveThresholds = 'save_thresholds',
  ShowTerraformConfig = 'show_terraform_config',
  RefetchTenantLimits = 'refetch_tenant_limits',
  InitializeAccessToken = 'initialize_access_token',
  UpdateCheckAlerts = 'update_check_alerts',
  NoProbeMappingFound = 'no_probe_mapping_found',
}

export enum FaroUserAction {
  CreateNewCheckClicked = 'create-new-check-clicked',
  CheckWizardNextClicked = 'check-wizard-next-clicked',
  CheckWizardPrevClicked = 'check-wizard-prev-clicked',
  CheckWizardTabClicked = 'check-wizard-tab-clicked',
  CheckCreateSubmitClicked = 'check-create-submit-clicked',
  CheckUpdateSubmitClicked = 'check-update-submit-clicked',
  CheckEditClicked = 'check-edit-clicked',
  CheckDuplicateClicked = 'check-duplicate-clicked',
  CheckDisableClicked = 'check-disable-clicked',
  CheckEnableClicked = 'check-enable-clicked',
  CheckDeleteClicked = 'check-delete-clicked',
  CheckDeleteConfirmationClicked = 'check-delete-confirmation-clicked',
  CheckDeleteCancellationClicked = 'check-delete-cancelation-clicked',
  AdhocCheckTestClicked = 'adhoc-check-test-clicked',
  ProbeEditorSubmitClicked = 'probe-editor-submit-clicked',
  ProbeSetupModalCopyValueClicked = 'probe-setup-modal-copy-value-clicked',
  SelectCheckTypeClicked = 'select-check-type-clicked',
  EditProbeSetupModalDismissClicked = 'edit-probe-setup-modal-dismiss-clicked',
  NewProbeCreateModalDismissClicked = 'new-probe-create-probe-modal-dismiss-clicked',
  EditPrivateProbeClicked = 'edit-private-probe-clicked',
  AddPrivateProbeClicked = 'add-private-probe-clicked',
  DeletePrivateProbeClicked = 'delete-private-probe-clicked',
  DeletePrivateProbeConfirmationClicked = 'delete-private-probe-confirmation-clicked',
  DeletePrivateProbeCancellationClicked = 'delete-private-probe-cancelation-clicked',
  ResetAccessTokenClicked = 'reset-access-token-clicked',
  ResetAccessTokenConfirmationClicked = 'reset-access-token-confirmation-clicked',
  ResetAccessTokenCancellationClicked = 'reset-access-token-cancelation-clicked',
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

function sanitizeError(error: Error | string): Error {
  if (isError(error)) {
    return error;
  }
  return new Error(String(error));
}

export function reportError(error: Error | string, type?: FaroEvent) {
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
        url: 'https://faro-collector-ops-eu-south-0.grafana-ops.net/collect/914df333264c1827e53d6a613704b6e6',
        name: 'synthetic-monitoring-app-dev',
        env: FaroEnv.Dev,
      };
    case FaroEnv.Staging:
      return {
        url: 'https://faro-collector-ops-eu-south-0.grafana-ops.net/collect/40defe4600ad1deb0d47487f46841da3',
        name: 'synthetic-monitoring-app-staging',
        env: FaroEnv.Staging,
      };
    case FaroEnv.Prod:
    default:
      return {
        url: 'https://faro-collector-ops-eu-south-0.grafana-ops.net/collect/eedd4e9616af3ea1847d89f0284979a9',
        name: 'synthetic-monitoring-app-prod',
        env: FaroEnv.Prod,
      };
  }
}
