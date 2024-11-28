import { hasGlobalPermission } from 'utils';
import { getUserPermissions } from 'data/permissions';

export function usePluginPermissions() {
  const { canWritePlugin } = getUserPermissions();

  return {
    canWritePlugin: hasGlobalPermission(`plugins:write`) && canWritePlugin,
  };
}
