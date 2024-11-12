import { OrgRole } from '@grafana/data';
import { config } from '@grafana/runtime';

import { PluginPermissions } from 'types';

const isUserActionAllowed = (permission: PluginPermissions, fallbackOrgRole: OrgRole) => {
  const { orgRole: userOrgRole, permissions: userPermissions } = config.bootData.user;
  const isAllowed = config.featureToggles.accessControlOnCall
    ? !!userPermissions?.[permission]
    : userOrgRole === fallbackOrgRole;

  return isAllowed;
};

export const getUserPermissions = () => {
  return {
    canReadChecks: isUserActionAllowed('grafana-synthetic-monitoring-app.checks:read', OrgRole.Viewer),
    canWriteChecks: isUserActionAllowed('grafana-synthetic-monitoring-app.checks:edit', OrgRole.Editor),
    canDeleteChecks: isUserActionAllowed('grafana-synthetic-monitoring-app.checks:delete', OrgRole.Editor),

    canReadProbes: isUserActionAllowed('grafana-synthetic-monitoring-app.probes:read', OrgRole.Viewer),
    canWriteProbes: isUserActionAllowed('grafana-synthetic-monitoring-app.probes:edit', OrgRole.Editor),
    canDeleteProbes: isUserActionAllowed('grafana-synthetic-monitoring-app.probes:delete', OrgRole.Editor),

    canReadAlerts: isUserActionAllowed('grafana-synthetic-monitoring-app.alerts:read', OrgRole.Viewer),
    canWriteAlerts: isUserActionAllowed('grafana-synthetic-monitoring-app.alerts:edit', OrgRole.Editor),
    canDeleteAlerts: isUserActionAllowed('grafana-synthetic-monitoring-app.alerts:delete', OrgRole.Editor),

    canReadThresholds: isUserActionAllowed('grafana-synthetic-monitoring-app.thresholds:read', OrgRole.Viewer),
    canWriteThresholds: isUserActionAllowed('grafana-synthetic-monitoring-app.thresholds:edit', OrgRole.Editor),

    canReadTokens: isUserActionAllowed('grafana-synthetic-monitoring-app.tokens:read', OrgRole.Viewer),
    canWriteTokens: isUserActionAllowed('grafana-synthetic-monitoring-app.tokens:write', OrgRole.Editor),
    canDeleteTokens: isUserActionAllowed('grafana-synthetic-monitoring-app.tokens:delete', OrgRole.Editor),

    canEnablePlugin: isUserActionAllowed('grafana-synthetic-monitoring-app.plugin:enable', OrgRole.Admin),
    canDisablePlugin: isUserActionAllowed('grafana-synthetic-monitoring-app.plugin:disable', OrgRole.Admin),
  };
};

export const useUserPermissions = () => getUserPermissions();
