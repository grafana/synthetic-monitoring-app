import { AppPlugin } from '@grafana/data';
import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
import { config } from '@grafana/runtime';

import { ProvisioningJsonData } from './types';
import { getFaroConfig } from 'faro';
import { App } from 'components/App';

import { PluginConfigPage } from './configPage/PluginConfigPage';

const { env, url, name } = getFaroConfig();

// faro was filling up the console with error logs, and it annoyed me, so I disabled it for localhost
if (window.location.hostname !== 'localhost') {
  initializeFaro({
    url,
    app: {
      name,
      version: config.apps['grafana-synthetic-monitoring-app'].version,
      environment: env,
    },
    isolate: true,
    user: {
      id: config.bootData.user.orgName,
    },
    instrumentations: getWebInstrumentations(),
  });
}

export const plugin = new AppPlugin<ProvisioningJsonData>().setRootPage(App).addConfigPage({
  title: 'Config',
  icon: 'cog',
  body: PluginConfigPage,
  id: 'config',
});
