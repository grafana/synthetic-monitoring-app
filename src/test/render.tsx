import React, { PropsWithChildren, type ReactElement, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { CompatRouter, Route, Routes } from 'react-router-dom-v5-compat';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppPluginMeta } from '@grafana/data';
import { render, type RenderOptions } from '@testing-library/react';
import userEventLib from '@testing-library/user-event';
import { createMemoryHistory, type MemoryHistory } from 'history';
import { SM_META } from 'test/fixtures/meta';

import { ProvisioningJsonData } from 'types';
import { MetaContextProvider } from 'contexts/MetaContext';
import { PermissionsContextProvider } from 'contexts/PermissionsContext';
import { SMDatasourceProvider } from 'contexts/SMDatasourceContext';
import { getQueryClient } from 'data/queryClient';
import { FeatureFlagProvider } from 'components/FeatureFlagProvider';

import { TestRouteInfo } from '../routes/test/TestRouteInfo';

export type ComponentWrapperProps = {
  children: ReactNode;
  history: MemoryHistory;
  route?: string;
  meta?: Partial<AppPluginMeta<ProvisioningJsonData>>;
};

type CreateWrapperProps = {
  path?: string;
  route?: string;
  meta?: Partial<AppPluginMeta<ProvisioningJsonData>>;
  wrapper?: (props: ComponentWrapperProps) => ReactElement;
};

const APP_ROOT = '/a/grafana-synthetic-monitoring-app';

function getRelativeRoute(route?: string) {
  if (!route) {
    return '*';
  }
  if (route.includes(`${APP_ROOT}/`)) {
    return route.replace(`${APP_ROOT}/`, '');
  }

  return route;
}

const DefaultWrapper = ({ children, route: _route, history, meta }: ComponentWrapperProps) => {
  const route = getRelativeRoute(_route);

  return (
    <QueryClientProvider client={getQueryClient()}>
      <MetaContextProvider meta={{ ...SM_META, ...meta }}>
        <FeatureFlagProvider>
          <SMDatasourceProvider>
            <PermissionsContextProvider>
              <MemoryRouter initialEntries={history.entries}>
                <CompatRouter>
                  <Routes>
                    <Route path={APP_ROOT}>
                      <Route
                        path={route}
                        element={
                          <>
                            <TestRouteInfo />
                            {children}
                          </>
                        }
                      />
                    </Route>
                    <Route path={route}>
                      <Route
                        path={route}
                        element={
                          <>
                            <TestRouteInfo />
                            {children}
                          </>
                        }
                      />
                    </Route>
                    <Route
                      path="*"
                      element={
                        <>
                          <TestRouteInfo />
                        </>
                      }
                    />
                  </Routes>
                </CompatRouter>
              </MemoryRouter>
            </PermissionsContextProvider>
          </SMDatasourceProvider>
        </FeatureFlagProvider>
      </MetaContextProvider>
    </QueryClientProvider>
  );
};

export const createWrapper = ({ route = '*', meta, path: _path, wrapper }: CreateWrapperProps = {}) => {
  const path = _path && _path.startsWith(`${APP_ROOT}/`) ? _path : `${APP_ROOT}/${_path}`.split('//').join('/');
  const Component = wrapper || DefaultWrapper;
  const history = createMemoryHistory({
    initialEntries: path ? [path] : [APP_ROOT],
  });

  const Wrapper = ({ children }: PropsWithChildren) => (
    <Component route={route} meta={meta} history={history}>
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
