import { AppPlugin, PluginMeta } from '@grafana/data';
import { GlobalSettings } from './types';
import { App } from 'components/App';
import { ConfigPage } from 'page/ConfigPage';
import { findSMDataSources } from 'utils';
import { getBackendSrv } from '@grafana/runtime';
import { updateSMDatasource } from 'initialization-utils';
import { getDashboardsNeedingUpdate, importAllDashboards } from 'dashboards/loader';

export const plugin = new AppPlugin<GlobalSettings>().setRootPage(App).addConfigPage({
  title: 'Config',
  icon: 'cog',
  body: ConfigPage,
  id: 'config',
});

const getPluginSettings = async () =>
  await getBackendSrv()
    .fetch<PluginMeta<GlobalSettings>>({
      url: `/api/plugins/grafana-synthetic-monitoring-app/settings`,
      method: 'GET',
      headers: { 'Cache-Control': 'no-store' },
    })
    .toPromise()
    .then((response) => response?.data?.jsonData);

const needToUpdateDSJson = (ds: GlobalSettings, plugin: GlobalSettings): boolean => {
  if (
    ds.logs.grafanaName !== plugin.logs.grafanaName ||
    ds.logs.grafanaName !== plugin.logs.grafanaName ||
    ds.metrics.grafanaName !== plugin.metrics.grafanaName ||
    ds.apiHost !== plugin.apiHost
  ) {
    return true;
  }
  return false;
};

const preloadInit = async () => {
  const smDatasources = findSMDataSources();
  const pluginSettings = await getPluginSettings();
  // if there is no SM datasource, we have nothing to do. If there is more than 1 we don't know what to do.
  if (smDatasources?.length === 1 && pluginSettings) {
    const smDS = smDatasources[0];
    const dsUpdateNeeded = needToUpdateDSJson(smDS.jsonData, pluginSettings);
    if (dsUpdateNeeded) {
      await updateSMDatasource(smDS.name, pluginSettings);
    }

    const dashboardsToUpdate = await getDashboardsNeedingUpdate(smDS.jsonData.dashboards);
    if (dashboardsToUpdate.length > 0) {
      importAllDashboards(
        pluginSettings.metrics.uid ?? pluginSettings.metrics.grafanaName,
        pluginSettings.logs.uid ?? pluginSettings.metrics.grafanaName,
        smDS.name
      );
    }
  }
};

preloadInit();
