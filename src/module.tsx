import React, { lazy, Suspense } from 'react';
import { AppPlugin, AppRootProps, NavModelItem } from '@grafana/data';
import { Spinner } from '@grafana/ui';
import { type SMPluginConfigPageProps } from 'configPage/PluginConfigPage';
import pluginJson from 'plugin.json';

import { ProvisioningJsonData } from './types';

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

const LazyTestingAndSyntheticsLanding = lazy(async () => {
  await ensureTranslationsInitialized();
  return import('externalComponents/testingLanding/TestingAndSyntheticsLandingPage').then((module) => ({
    default: module.TestingAndSyntheticsLandingPage,
  }));
});

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

interface TestingAndSyntheticsLandingProps {
  node: NavModelItem;
}

const SuspendedTestingAndSyntheticsLanding = (props: TestingAndSyntheticsLandingProps) => (
  <Suspense fallback={<Spinner />}>
    <LazyTestingAndSyntheticsLanding {...props} />
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
  .addComponent<TestingAndSyntheticsLandingProps>({
    targets: 'grafana/dynamic/nav-landing-page/nav-id-testing-and-synthetics/v1',
    title: 'Testing & synthetics landing page',
    description: 'Disambiguation landing page for Synthetic Monitoring and Grafana Cloud k6',
    component: SuspendedTestingAndSyntheticsLanding,
  });
