import { AppPlugin } from '@grafana/data';
import { GlobalSettings } from './types';
import { App } from 'components/App';
import { ConfigPageWrapper } from 'components/ConfigPageWrapper';

import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
import { config } from '@grafana/runtime';
import { getFaroConfig } from 'faro';

const { env, url, name } = getFaroConfig();

export const faro = initializeFaro({
  url,
  app: {
    name,
    version: config.apps['grafana-synthetic-monitoring-app'].version,
    environment: env,
  },
  isolate: true,
  instrumentations: getWebInstrumentations(),
});

export const plugin = new AppPlugin<GlobalSettings>().setRootPage(App).addConfigPage({
  title: 'Config',
  icon: 'cog',
  body: ConfigPageWrapper,
  id: 'config',
});
