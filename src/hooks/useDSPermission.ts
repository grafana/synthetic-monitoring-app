import { OrgRole } from '@grafana/data';
import { config } from '@grafana/runtime';

import { usePermissionsContext } from 'contexts/PermissionsContext';

type DSOptions = `sm` | `metrics` | `logs`;

export function useDSPermission(ds: DSOptions, permission: string) {
  const { smDS, metricsDS, logsDS } = usePermissionsContext();

  switch (ds) {
    case `sm`:
      return smDS.includes(permission);
    case `metrics`:
      return metricsDS.includes(permission);
    case `logs`:
      return logsDS.includes(permission);
  }
}

export function useCanReadMetrics() {
  return useDSPermission(`metrics`, `datasources:read`);
}

export function useCanWriteMetrics() {
  return useDSPermission(`metrics`, `datasources:write`);
}

export function useCanReadLogs() {
  return useDSPermission(`logs`, `datasources:read`);
}

export function useCanWriteLogs() {
  return useDSPermission(`logs`, `datasources:write`);
}

export function useCanReadSM() {
  return useDSPermission(`sm`, `datasources:read`);
}

// we've rolled this back to respect org roles
// this will change when we do proper plugin RBAC in the near future
// Note: this is used by `PluginConfigPage`, which is not wrapped in any app context
export function useCanWriteSM() {
  const orgRole = config.bootData.user.orgRole;

  if (orgRole) {
    return [OrgRole.Editor, OrgRole.Admin].includes(orgRole);
  }

  return false;
}
