import { OrgRole } from '@grafana/data';
import { config } from '@grafana/runtime';

import { PluginPermissions } from 'types';

const roleHierarchy: Record<OrgRole, OrgRole[]> = {
  [OrgRole.Viewer]: [OrgRole.Viewer, OrgRole.Editor, OrgRole.Admin],
  [OrgRole.Editor]: [OrgRole.Editor, OrgRole.Admin],
  [OrgRole.Admin]: [OrgRole.Admin],
  [OrgRole.None]: [],
};

const hasMinFallbackRole = (fallbackOrgRole: OrgRole) => {
  const { orgRole } = config.bootData.user;

  if (!orgRole) {
    return false;
  }

  return roleHierarchy[fallbackOrgRole]?.includes(orgRole) || false;
};

const isUserActionAllowed = (permission: PluginPermissions, fallbackOrgRole: OrgRole): boolean => {
  const { permissions: userPermissions } = config.bootData.user;

  if (config.featureToggles.accessControlOnCall) {
    return Boolean(userPermissions?.[permission]);
  }

  return hasMinFallbackRole(fallbackOrgRole);
};

export const getUserPermissions = () => ({
  canReadChecks: isUserActionAllowed('grafana-synthetic-monitoring-app.checks:read', OrgRole.Viewer),
  canWriteChecks: isUserActionAllowed('grafana-synthetic-monitoring-app.checks:write', OrgRole.Editor),
  canDeleteChecks: isUserActionAllowed('grafana-synthetic-monitoring-app.checks:delete', OrgRole.Editor),

  canReadProbes: isUserActionAllowed('grafana-synthetic-monitoring-app.probes:read', OrgRole.Viewer),
  canWriteProbes: isUserActionAllowed('grafana-synthetic-monitoring-app.probes:write', OrgRole.Editor),
  canDeleteProbes: isUserActionAllowed('grafana-synthetic-monitoring-app.probes:delete', OrgRole.Editor),

  canReadAlerts: isUserActionAllowed('grafana-synthetic-monitoring-app.alerts:read', OrgRole.Viewer),
  canWriteAlerts: isUserActionAllowed('grafana-synthetic-monitoring-app.alerts:write', OrgRole.Editor),
  canDeleteAlerts: isUserActionAllowed('grafana-synthetic-monitoring-app.alerts:delete', OrgRole.Editor),

  canReadThresholds: isUserActionAllowed('grafana-synthetic-monitoring-app.thresholds:read', OrgRole.Viewer),
  canWriteThresholds: isUserActionAllowed('grafana-synthetic-monitoring-app.thresholds:write', OrgRole.Editor),

  canReadTokens: isUserActionAllowed('grafana-synthetic-monitoring-app.access-tokens:read', OrgRole.Admin),
  canWriteTokens: isUserActionAllowed('grafana-synthetic-monitoring-app.access-tokens:write', OrgRole.Admin),
  canDeleteTokens: isUserActionAllowed('grafana-synthetic-monitoring-app.access-tokens:delete', OrgRole.Admin),

  canEnablePlugin: isUserActionAllowed('grafana-synthetic-monitoring-app.plugin:enable', OrgRole.Admin),
  canDisablePlugin: isUserActionAllowed('grafana-synthetic-monitoring-app.plugin:disable', OrgRole.Admin),
});
