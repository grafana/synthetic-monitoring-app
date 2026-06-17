import { config } from '@grafana/runtime';

/**
 * URL for a plugin's static image under `/public/plugins/<pluginId>/img/`.
 * Uses the installed plugin's assets (see plugin.json `info.logos`) — no bundled copy in this app.
 */
export function getPluginLogoUrl(pluginId: string, logoFile = 'logo.svg'): string {
  const appSubUrl = config.appSubUrl ?? '';
  return `${appSubUrl}/public/plugins/${pluginId}/img/${logoFile}`;
}
