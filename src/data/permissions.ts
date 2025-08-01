import { OrgRole } from '@grafana/data';
import { config } from '@grafana/runtime';

import { FeatureName, FixedSecretPermission, PluginPermissions } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';

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

const isUserActionAllowed = (
  permission: PluginPermissions | FixedSecretPermission,
  fallbackOrgRole: OrgRole
): boolean => {
  const { permissions: userPermissions } = config.bootData.user;

  const rbacEnabled = isFeatureEnabled(FeatureName.RBAC);
  if (rbacEnabled) {
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

  canWriteTokens: isUserActionAllowed('grafana-synthetic-monitoring-app.access-tokens:write', OrgRole.Editor),

  canWritePlugin: isUserActionAllowed('grafana-synthetic-monitoring-app.plugin:write', OrgRole.Admin),

  canWriteSM: isUserActionAllowed('grafana-synthetic-monitoring-app:write', OrgRole.Editor),

  canCreateSecrets: isUserActionAllowed('secret.securevalues:create', OrgRole.Admin),
  canReadSecrets: isUserActionAllowed('secret.securevalues:read', OrgRole.Admin),
  canUpdateSecrets: isUserActionAllowed('secret.securevalues:update', OrgRole.Admin),
  canDeleteSecrets: isUserActionAllowed('secret.securevalues:delete', OrgRole.Admin),

  isAdmin: hasMinFallbackRole(OrgRole.Admin),
});
