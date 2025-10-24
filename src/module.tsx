import React, { lazy } from 'react';
import { AppPlugin, AppRootProps } from '@grafana/data';

import { ProvisioningJsonData } from './types';

if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_MSW) {
  await import('./startServerWorker');
}

const LazyApp = lazy(() => import('components/App'));
const LazyPluginConfigPage = lazy(() =>
  import('configPage/PluginConfigPage').then((module) => ({ default: module.PluginConfigPage }))
);

const App = (props: AppRootProps<ProvisioningJsonData>) => <LazyApp {...props} />;

export const plugin = new AppPlugin<ProvisioningJsonData>().setRootPage(App).addConfigPage({
  title: 'Config',
  icon: 'cog',
  body: LazyPluginConfigPage,
  id: 'config',
});
