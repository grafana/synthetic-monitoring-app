import React, { type ReactElement, type ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router';
import { Route } from 'react-router-dom';
import { AppPluginMeta, DataSourceSettings } from '@grafana/data';
import userEventLib from '@testing-library/user-event';

import { GlobalSettings, GrafanaInstances } from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import { getInstanceMock, instanceSettings } from 'datasource/__mocks__/DataSource';
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
};

export const createWrapper = ({ featureToggles, instance = createInstance(), path, route }: WrapperProps = {}) => {
  const meta = {} as AppPluginMeta<GlobalSettings>;
  const history = createMemoryHistory({
    initialEntries: path ? [path] : undefined,
  });
  const isFeatureEnabled = (feature: string) => !!featureToggles?.[feature];

  // eslint-disable-next-line react/display-name
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <FeatureFlagProvider overrides={{ featureToggles, isFeatureEnabled }}>
      <InstanceContext.Provider value={{ instance, loading: false, meta }}>
        <Router history={history}>
          <Route path={route}>{children}</Route>
        </Router>
      </InstanceContext.Provider>
    </FeatureFlagProvider>
  );

  return { Wrapper, instance, history };
};

type CustomRenderOptions = Omit<RenderOptions, 'wrapper'> & {
  featureToggles?: Record<string, boolean>;
  instance?: GrafanaInstances;
  path?: string;
  route?: string;
};

const customRender = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  const { featureToggles, instance: instanceOptions, path, route, ...rest } = options;
  const user = userEventLib.setup();
  const { Wrapper, history, instance } = createWrapper({ featureToggles, instance: instanceOptions, path, route });

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
