import React, { lazy, Suspense } from 'react';
import { AppPlugin, AppRootProps } from '@grafana/data';
import { Spinner } from '@grafana/ui';
import { type SMPluginConfigPageProps } from 'configPage/PluginConfigPage';
import pluginJson from 'plugin.json';

import { ProvisioningJsonData } from './types';
import { type SyntheticChecksPanelProps } from 'exposedComponents/SyntheticChecksPanel/SyntheticChecksPanel.types';

if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_MSW) {
  await import('./startServerWorker');
}

let translationsPromise: Promise<void>;

function ensureTranslationsInitialized(): Promise<void> {
  if (!translationsPromise) {
    translationsPromise = import('@grafana/i18n').then(async ({ initPluginTranslations }) => {
      await initPluginTranslations(pluginJson.id);
    });
  }
  return translationsPromise;
}

const LazyApp = lazy(async () => {
  await ensureTranslationsInitialized();
  return import('components/App');
});

const LazyPluginConfigPage = lazy(async () => {
  await ensureTranslationsInitialized();
  return import('configPage/PluginConfigPage').then((module) => ({ default: module.PluginConfigPage }));
});

const LazySyntheticChecksPanel = lazy(
  () => import('exposedComponents/SyntheticChecksPanel/SyntheticChecksPanelExposed')
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

const SuspendedSyntheticChecksPanel = (props: SyntheticChecksPanelProps) => (
  <Suspense fallback={<Spinner />}>
    <LazySyntheticChecksPanel {...props} />
  </Suspense>
);

const App = (props: AppRootProps<ProvisioningJsonData>) => <SuspendedLazyApp {...props} />;

export const plugin = new AppPlugin<ProvisioningJsonData>()
  .setRootPage(App)
  .addConfigPage({
    title: 'Config',
    icon: 'cog',
    body: SuspendedLazyPluginConfigPage,
    id: 'config',
  })
  .exposeComponent({
    id: `${pluginJson.id}/synthetic-checks-panel/v1`,
    title: 'Synthetic Checks Panel',
    description: 'Displays SM checks with uptime, reachability, and latency metrics. Accepts label filters to scope checks.',
    component: SuspendedSyntheticChecksPanel,
  });
