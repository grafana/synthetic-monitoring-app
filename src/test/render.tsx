import React, { PropsWithChildren, type ReactElement, type ReactNode } from 'react';
import { Route, Router } from 'react-router-dom';
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

const DefaultWrapper = ({ children, history, route, meta }: ComponentWrapperProps) => {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <MetaContextProvider meta={{ ...SM_META, ...meta }}>
        <FeatureFlagProvider>
          <SMDatasourceProvider>
            <PermissionsContextProvider>
              <Router history={history}>
                <Route path={route}>{children}</Route>
              </Router>
            </PermissionsContextProvider>
          </SMDatasourceProvider>
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
