import React, { lazy, Suspense } from 'react';
import { AppPlugin, AppRootProps } from '@grafana/data';
import { Spinner } from '@grafana/ui';
import { type SMPluginConfigPageProps } from 'configPage/PluginConfigPage';

import { ProvisioningJsonData } from './types';

if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_MSW) {
  await import('./startServerWorker');
}

const LazyApp = lazy(() => import('components/App'));
const LazyPluginConfigPage = lazy(() =>
  import('configPage/PluginConfigPage').then((module) => ({ default: module.PluginConfigPage }))
);

const SuspendedLazyApp = (props: AppRootProps<ProvisioningJsonData>) => (
  <Suspense fallback={<Spinner />}>
    <LazyApp {...props} />
  </Suspense>
);
const SuspendedLazyPluginConfigPage = (props: SMPluginConfigPageProps) => (
  <Suspense fallback={<Spinner />}>
    <LazyPluginConfigPage {...props} />
  </Suspense>
);

const App = (props: AppRootProps<ProvisioningJsonData>) => <SuspendedLazyApp {...props} />;

export const plugin = new AppPlugin<ProvisioningJsonData>().setRootPage(App).addConfigPage({
  title: 'Config',
  icon: 'cog',
  body: SuspendedLazyPluginConfigPage,
  id: 'config',
});
