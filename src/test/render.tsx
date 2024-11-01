import React, { PropsWithChildren, type ReactElement, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom-v5-compat';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppPluginMeta } from '@grafana/data';
import { render, type RenderOptions } from '@testing-library/react';
import userEventLib from '@testing-library/user-event';
import { SM_META } from 'test/fixtures/meta';

import { ProvisioningJsonData } from 'types';
import { MetaContextProvider } from 'contexts/MetaContext';
import { PermissionsContextProvider } from 'contexts/PermissionsContext';
import { SMDatasourceProvider } from 'contexts/SMDatasourceContext';
import { getQueryClient } from 'data/queryClient';
import { FeatureFlagProvider } from 'components/FeatureFlagProvider';

export type ComponentWrapperProps = {
  children: ReactNode;
  route?: string;
  meta?: Partial<AppPluginMeta<ProvisioningJsonData>>;
};

type CreateWrapperProps = {
  path?: string;
  route?: string;
  meta?: Partial<AppPluginMeta<ProvisioningJsonData>>;
  wrapper?: (props: ComponentWrapperProps) => ReactElement;
};

const DefaultWrapper = ({ children, route, meta }: ComponentWrapperProps) => {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <MetaContextProvider meta={{ ...SM_META, ...meta }}>
        <FeatureFlagProvider>
          <SMDatasourceProvider>
            <PermissionsContextProvider>
              <Routes>
                <Route path={route}>{children}</Route>
              </Routes>
            </PermissionsContextProvider>
          </SMDatasourceProvider>
        </FeatureFlagProvider>
      </MetaContextProvider>
    </QueryClientProvider>
  );
};

export const createWrapper = ({ route, meta, wrapper }: CreateWrapperProps = {}) => {
  const Component = wrapper || DefaultWrapper;

  const Wrapper = ({ children }: PropsWithChildren) => (
    <Component route={route} meta={meta}>
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
