import React, { type ReactElement, type ReactNode } from 'react';
import { Route, Router } from 'react-router-dom';
import { AppPluginMeta, PluginType } from '@grafana/data';
import { render, type RenderOptions } from '@testing-library/react';
import userEventLib from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import pluginInfo from 'plugin.json';

import { GlobalSettings } from 'types';
import { ChecksContextProvider } from 'components/ChecksContextProvider';
import { FeatureFlagProvider } from 'components/FeatureFlagProvider';
import { InstanceProvider } from 'components/InstanceProvider';

type WrapperProps = {
  path?: string;
  route?: string;
  meta?: Partial<AppPluginMeta<GlobalSettings>>;
};

export const createWrapper = ({ path, route, meta }: WrapperProps = {}) => {
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

  // eslint-disable-next-line react/display-name
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <FeatureFlagProvider>
      <InstanceProvider
        meta={{
          ...defaultMeta,
          ...meta,
        }}
      >
        <ChecksContextProvider>
          <Router history={history}>
            <Route path={route}>{children}</Route>
          </Router>
        </ChecksContextProvider>
      </InstanceProvider>
    </FeatureFlagProvider>
  );

  return { Wrapper, history };
};

export type CustomRenderOptions = Omit<RenderOptions, 'wrapper'> & WrapperProps;

const customRender = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  const { path, route, meta, ...rest } = options;
  const user = userEventLib.setup();
  const { Wrapper, history } = createWrapper({
    path,
    route,
    meta,
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
