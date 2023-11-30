import React, { type ReactElement, type ReactNode } from 'react';
import { Route, Router } from 'react-router-dom';
import { AppPluginMeta, DataSourceSettings, PluginType } from '@grafana/data';
import { render, type RenderOptions } from '@testing-library/react';
import userEventLib from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import pluginInfo from 'plugin.json';
import { getInstanceMock, instanceSettings } from 'datasource/__mocks__/DataSource';

import { GlobalSettings, GrafanaInstances } from 'types';
import { ChecksContext } from 'contexts/ChecksContext';
import { InstanceContext } from 'contexts/InstanceContext';
import { ChecksContextProvider } from 'components/ChecksContextProvider';
import { FeatureFlagProvider } from 'components/FeatureFlagProvider';

export const createInstance = (options?: GrafanaInstances) => {
  return {
    api: getInstanceMock(instanceSettings),
    alertRuler: {} as DataSourceSettings,
    metrics: {} as DataSourceSettings,
    logs: {} as DataSourceSettings,
    ...options,
  };
};

type WrapperProps = {
  featureToggles?: Record<string, boolean>;
  instance?: GrafanaInstances;
  path?: string;
  route?: string;
  meta?: Partial<AppPluginMeta<GlobalSettings>>;
};

export const createWrapper = ({
  featureToggles,
  instance = createInstance(),
  path,
  route,
  meta,
}: WrapperProps = {}) => {
  const defaultMeta = {
    id: pluginInfo.id,
    name: pluginInfo.name,
    type: PluginType.app,
    info: { ...pluginInfo.info, links: [] },
    module: `/public/plugins/grafana-synthetic-monitoring-app/module.js`,
    baseUrl: `/public/plugins/grafana-synthetic-monitoring-app`,
    enabled: true,
    jsonData: {
      metrics: {
        grafanaName: 'prometheus',
        hostedId: 123,
      },
      logs: {
        grafanaName: 'loki',
        hostedId: 456,
      },
      apiHost: 'https://synthetic-monitoring-api.grafana.net',
      stackId: 1,
    },
  };

  const history = createMemoryHistory({
    initialEntries: path ? [path] : undefined,
  });
  const isFeatureEnabled = (feature: string) => !!featureToggles?.[feature];

  // eslint-disable-next-line react/display-name
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <FeatureFlagProvider overrides={{ featureToggles, isFeatureEnabled }}>
      <InstanceContext.Provider
        value={{
          instance,
          loading: false,
          meta: {
            ...defaultMeta,
            ...meta,
          },
        }}
      >
        <ChecksContextProvider>
          <Router history={history}>
            <Route path={route}>{children}</Route>
          </Router>
        </ChecksContextProvider>
      </InstanceContext.Provider>
    </FeatureFlagProvider>
  );

  return { Wrapper, instance, history };
};

export type CustomRenderOptions = Omit<RenderOptions, 'wrapper'> & WrapperProps;

const customRender = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  const { featureToggles, instance: instanceOptions, path, route, meta, ...rest } = options;
  const user = userEventLib.setup();
  const { Wrapper, history, instance } = createWrapper({
    featureToggles,
    instance: instanceOptions,
    path,
    route,
    meta,
  });

  return {
    user,
    instance,
    history,
    ...render(ui, {
      wrapper: Wrapper,
      ...rest,
    }),
  };
};

export { customRender as render };
