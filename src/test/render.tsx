import React, { PropsWithChildren, type ReactElement, type ReactNode } from 'react';
import { Route, Router, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppPluginMeta } from '@grafana/data';
import { locationService, LocationServiceProvider } from '@grafana/runtime';
import { render, type RenderOptions } from '@testing-library/react';
import userEventLib from '@testing-library/user-event';
import { SM_META } from 'test/fixtures/meta';
import { TestRouteInfo } from 'test/helpers/TestRouteInfo';
import { useLocationServiceHistory } from 'test/helpers/useLocationServiceHistory';

import { ProvisioningJsonData } from 'types';
import { MetaContextProvider } from 'contexts/MetaContext';
import { PermissionsContextProvider } from 'contexts/PermissionsContext';
import { SMDatasourceProvider } from 'contexts/SMDatasourceContext';
import { getQueryClient } from 'data/queryClient';
import { FeatureFlagProvider } from 'components/FeatureFlagProvider';

export type ComponentWrapperProps = {
  children: ReactNode;
  initialEntries?: string[];
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

const DefaultWrapper = ({ children, route: _route, initialEntries, meta }: ComponentWrapperProps) => {
  const relativeRoute = getRelativeRoute(_route);
  const initialPath = initialEntries?.[0] || APP_ROOT;
  const { history, location } = useLocationServiceHistory(initialPath);
  const fullRoutePattern = `${APP_ROOT}/${relativeRoute}`.replace('//', '/');

  return (
    <LocationServiceProvider service={locationService}>
      <Router navigator={history} location={location}>
        <QueryClientProvider client={getQueryClient()}>
          <MetaContextProvider meta={{ ...SM_META, ...meta }}>
            <FeatureFlagProvider>
              <SMDatasourceProvider>
                <PermissionsContextProvider>
                  <TestRouteInfo />
                  <Routes>
                    <Route path={fullRoutePattern} element={children} />
                    <Route path="*" element={children} />
                  </Routes>
                </PermissionsContextProvider>
              </SMDatasourceProvider>
            </FeatureFlagProvider>
          </MetaContextProvider>
        </QueryClientProvider>
      </Router>
    </LocationServiceProvider>
  );
};

export const createWrapper = ({ route = '*', meta, path: _path, wrapper }: CreateWrapperProps = {}) => {
  const path = _path
    ? _path.startsWith(`${APP_ROOT}/`)
      ? _path
      : `${APP_ROOT}/${_path}`.replace('//', '/')
    : APP_ROOT;
  const Component = wrapper || DefaultWrapper;
  const initialEntries = [path];

  const Wrapper = ({ children }: PropsWithChildren) => (
    <Component route={route} meta={meta} initialEntries={initialEntries}>
      {children}
    </Component>
  );

  return { Wrapper, initialEntries };
};

export type CustomRenderOptions = Omit<RenderOptions, 'wrapper'> & CreateWrapperProps;

const customRender = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  const { path, route, meta, wrapper, ...rest } = options;
  const user = userEventLib.setup();
  const { Wrapper, initialEntries } = createWrapper({
    path,
    route,
    meta,
    wrapper,
  });

  return {
    user,
    initialEntries,
    ...render(ui, {
      wrapper: Wrapper,
      ...rest,
    }),
  };
};

export { customRender as render };
