import React, { type ReactElement, type ReactNode } from 'react';
import { Route, Router } from 'react-router-dom';
import { AppPluginMeta, PluginType } from '@grafana/data';
import { render, type RenderOptions } from '@testing-library/react';
import userEventLib from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import pluginInfo from 'plugin.json';

import { GlobalSettings } from 'types';
import { FeatureFlagProvider } from 'components/FeatureFlagProvider';
import { InstanceProvider } from 'components/InstanceProvider';

type WrapperProps = {
  featureToggles?: Record<string, boolean>;
  path?: string;
  route?: string;
  meta?: Partial<AppPluginMeta<GlobalSettings>>;
};

export const createWrapper = ({ featureToggles, path, route, meta }: WrapperProps = {}) => {
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
      <InstanceProvider
        meta={{
          ...defaultMeta,
          ...meta,
        }}
      >
        <Router history={history}>
          <Route path={route}>{children}</Route>
        </Router>
      </InstanceProvider>
    </FeatureFlagProvider>
  );

  return { Wrapper, history };
};

export type CustomRenderOptions = Omit<RenderOptions, 'wrapper'> & WrapperProps;

const customRender = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  const { featureToggles, path, route, meta, ...rest } = options;
  const user = userEventLib.setup();
  const { Wrapper, history } = createWrapper({
    featureToggles,
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
