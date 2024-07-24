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

export function useCanWriteSM() {
  return useDSPermission(`sm`, `datasources:write`);
}
