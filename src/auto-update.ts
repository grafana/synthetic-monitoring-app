import { findSMDataSources, getPluginSettings } from 'utils';
import { updateSMDatasource } from 'initialization-utils';
import { importAllDashboards, listAppDashboards } from 'dashboards/loader';
import appEvents from 'grafana/app/core/app_events';
import { DashboardMeta, GlobalSettings } from 'types';
import { AppEvents } from '@grafana/data';
import { DashboardInfo } from 'datasource/types';

const needToUpdateDSJson = (ds: GlobalSettings, plugin: GlobalSettings): boolean => {
  if (
    !ds.logs ||
    !ds.metrics ||
    ds.logs.grafanaName !== plugin.logs.grafanaName ||
    ds.logs.grafanaName !== plugin.logs.grafanaName ||
    ds.metrics.grafanaName !== plugin.metrics.grafanaName ||
    ds.apiHost !== plugin.apiHost
  ) {
    return true;
  }

  return false;
};

export async function getDashboardsNeedingUpdate(dsDashboards: DashboardInfo[] = []): Promise<DashboardMeta[]> {
  const latestDashboards = await listAppDashboards();
  return dsDashboards
    .map((existingDashboard) => {
      const templateDashboard = latestDashboards.find((template) => template.uid === existingDashboard.uid);
      const templateVersion = templateDashboard?.latestVersion ?? -1;
      if (templateDashboard && templateVersion > existingDashboard.version) {
        return {
          ...existingDashboard,
          version: templateDashboard.latestVersion,
          latestVersion: templateDashboard.latestVersion,
        };
      }
      return null;
    })
    .filter(Boolean) as DashboardMeta[];
}

export const autoUpdate = async () => {
  try {
    const smDatasources = findSMDataSources();
    // if there is no SM datasource, we have nothing to do. If there is more than 1 we don't know what to do.
    if (smDatasources.length !== 1) {
      return;
    }
    const pluginSettings = await getPluginSettings();
    if (!pluginSettings) {
      return;
    }
    const smDS = smDatasources[0];
    const dsUpdateNeeded = needToUpdateDSJson(smDS.jsonData, pluginSettings);
    if (dsUpdateNeeded) {
      await updateSMDatasource(smDS.name, pluginSettings);
    }

    const dashboardsToUpdate = await getDashboardsNeedingUpdate(smDS.jsonData.dashboards);
    if (dashboardsToUpdate.length > 0) {
      importAllDashboards(
        pluginSettings.metrics.uid ?? pluginSettings.metrics.grafanaName,
        pluginSettings.logs.uid ?? pluginSettings.logs.grafanaName,
        smDS.name
      );

      appEvents.emit(AppEvents.alertSuccess, ['Synthetic Monitoring dashboards updated']);
    }
  } catch (e) {
    // Should fail silently
    console.error(`Synthetic Monitoring failed to update resources: ${e}`);
  }
};
