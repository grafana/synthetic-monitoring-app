import { AppPlugin } from '@grafana/data';
import { GlobalSettings } from './types';
import { App } from 'components/App';
import { ConfigPageWrapper } from 'components/ConfigPageWrapper';

import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';
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
  instrumentations: [
    // Mandatory, overwriting the instrumentations array would cause the default instrumentations to be omitted
    ...getWebInstrumentations(),

    // Initialization of the tracing package.
    // This packages is optional because it increases the bundle size noticeably. Only add it if you want tracing data.
    new TracingInstrumentation(),
  ],
});

export const plugin = new AppPlugin<GlobalSettings>().setRootPage(App).addConfigPage({
  title: 'Config',
  icon: 'cog',
  body: ConfigPageWrapper,
  id: 'config',
});
