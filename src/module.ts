import { AppPlugin } from '@grafana/data';
import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
import { config } from '@grafana/runtime';

import { GlobalSettings } from './types';
import { getFaroConfig } from 'faro';
import { App } from 'components/App';
import { ConfigPageWrapper } from 'components/ConfigPageWrapper';

const { env, url, name } = getFaroConfig();

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

export const plugin = new AppPlugin<GlobalSettings>().setRootPage(App).addConfigPage({
  title: 'Config',
  icon: 'cog',
  body: ConfigPageWrapper,
  id: 'config',
});
