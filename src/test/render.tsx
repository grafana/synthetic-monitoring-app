import React, { PropsWithChildren, type ReactElement, type ReactNode } from 'react';
import { Route, Router } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppPluginMeta, PluginType } from '@grafana/data';
import { render, type RenderOptions } from '@testing-library/react';
import userEventLib from '@testing-library/user-event';
import { createMemoryHistory, type MemoryHistory } from 'history';
import pluginInfo from 'plugin.json';

import { GlobalSettings } from 'types';
import { MetaContextProvider } from 'contexts/MetaContext';
import { SMDatasourceProvider } from 'contexts/SMDatasourceContext';
import { getQueryClient } from 'data/queryClient';
import { FeatureFlagProvider } from 'components/FeatureFlagProvider';
import { InstanceProvider } from 'components/InstanceProvider';

export type ComponentWrapperProps = {
  children: ReactNode;
  history: MemoryHistory;
  route?: string;
  meta?: Partial<AppPluginMeta<GlobalSettings>>;
};

type CreateWrapperProps = {
  path?: string;
  route?: string;
  meta?: Partial<AppPluginMeta<GlobalSettings>>;
  wrapper?: (props: ComponentWrapperProps) => ReactElement;
};

export const defaultTestMeta = {
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

const DefaultWrapper = ({ children, history, route, meta }: ComponentWrapperProps) => {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <MetaContextProvider meta={{ ...defaultTestMeta, ...meta }}>
        <FeatureFlagProvider>
          <Router history={history}>
            <SMDatasourceProvider>
              <InstanceProvider>
                <Route path={route}>{children}</Route>
              </InstanceProvider>
            </SMDatasourceProvider>
          </Router>
        </FeatureFlagProvider>
      </MetaContextProvider>
    </QueryClientProvider>
  );
};

export const createWrapper = ({ path, route, meta, wrapper }: CreateWrapperProps = {}) => {
  const history = createMemoryHistory({
    initialEntries: path ? [path] : undefined,
  });

  const Component = wrapper || DefaultWrapper;

  const Wrapper = ({ children }: PropsWithChildren) => (
    <Component history={history} route={route} meta={meta}>
      {children}
    </Component>
  );

  return { Wrapper, history };
};

export type CustomRenderOptions = Omit<RenderOptions, 'wrapper'> & CreateWrapperProps;

const customRender = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  const { path, route, meta, wrapper, ...rest } = options;
  const user = userEventLib.setup();
  const { Wrapper, history } = createWrapper({
    path,
    route,
    meta,
    wrapper,
  });

  return {
    user,
    history,
    ...render(ui, {
      wrapper: Wrapper,
      ...rest,
    }),
  };
};

export { customRender as render };
