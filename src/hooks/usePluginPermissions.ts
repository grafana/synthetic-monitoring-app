import { hasGlobalPermission } from 'utils';
import { getUserPermissions } from 'data/permissions';

export function usePluginPermissions() {
  const canEditPlugin = hasGlobalPermission(`plugins:write`);
  const { canEnablePlugin, canDisablePlugin } = getUserPermissions();

  return {
    canEnablePlugin: canEditPlugin && canEnablePlugin,
    canDisablePlugin: canEditPlugin && canDisablePlugin,
    canEditPlugin,
  };
}
