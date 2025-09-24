import { OrgRole } from '@grafana/data';
import { config } from '@grafana/runtime';

import { FixedSecretPermission, PluginPermissions } from 'types';

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

const isUserActionAllowed = (permission: PluginPermissions | FixedSecretPermission): boolean => {
  const { permissions: userPermissions } = config.bootData.user;

  return Boolean(userPermissions?.[permission]);
};

export const getUserPermissions = () => ({
  canReadChecks: isUserActionAllowed('grafana-synthetic-monitoring-app.checks:read'),
  canWriteChecks: isUserActionAllowed('grafana-synthetic-monitoring-app.checks:write'),
  canDeleteChecks: isUserActionAllowed('grafana-synthetic-monitoring-app.checks:delete'),

  canReadProbes: isUserActionAllowed('grafana-synthetic-monitoring-app.probes:read'),
  canWriteProbes: isUserActionAllowed('grafana-synthetic-monitoring-app.probes:write'),
  canDeleteProbes: isUserActionAllowed('grafana-synthetic-monitoring-app.probes:delete'),

  canReadAlerts: isUserActionAllowed('grafana-synthetic-monitoring-app.alerts:read'),
  canWriteAlerts: isUserActionAllowed('grafana-synthetic-monitoring-app.alerts:write'),
  canDeleteAlerts: isUserActionAllowed('grafana-synthetic-monitoring-app.alerts:delete'),

  canReadThresholds: isUserActionAllowed('grafana-synthetic-monitoring-app.thresholds:read'),
  canWriteThresholds: isUserActionAllowed('grafana-synthetic-monitoring-app.thresholds:write'),

  canWriteTokens: isUserActionAllowed('grafana-synthetic-monitoring-app.access-tokens:write'),

  canWritePlugin: isUserActionAllowed('grafana-synthetic-monitoring-app.plugin:write'),

  canWriteSM: isUserActionAllowed('grafana-synthetic-monitoring-app:write'),

  canCreateSecrets: isUserActionAllowed('secret.securevalues:create'),
  canReadSecrets: isUserActionAllowed('secret.securevalues:read'),
  canUpdateSecrets: isUserActionAllowed('secret.securevalues:write'),
  canDeleteSecrets: isUserActionAllowed('secret.securevalues:delete'),

  isAdmin: hasMinFallbackRole(OrgRole.Admin),
});
