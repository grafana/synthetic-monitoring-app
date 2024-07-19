import { contextSrv as grafanaContextSrv } from 'grafana/app/core/core';

export function useContextSrv() {
  return grafanaContextSrv;
}

export function useIsGrafanaEditor() {
  const contextSrv = useContextSrv();

  return contextSrv.isEditor;
}

export function useGrafanaRole() {
  const contextSrv = useContextSrv();

  return contextSrv.user.orgRole;
}

export function useCanCreateDatasources() {
  const contextSrv = useContextSrv();

  return contextSrv.hasPermission('datasources:create');
}

export function useHasPermission(permission: string) {
  const contextSrv = useContextSrv();

  return contextSrv.hasPermission(permission);
}
