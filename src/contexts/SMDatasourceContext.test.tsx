import React from 'react';
import { Router } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import runTime from '@grafana/runtime';
import { screen } from '@testing-library/react';
import { ComponentWrapperProps, defaultTestMeta, render } from 'test/render';

import { getQueryClient } from 'data/queryClient';
import { FeatureFlagProvider } from 'components/FeatureFlagProvider';

import { MetaContextProvider } from './MetaContext';
import { SMDatasourceProvider } from './SMDatasourceContext';

const Wrapper = ({ children, history, meta }: ComponentWrapperProps) => {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <MetaContextProvider meta={{ ...defaultTestMeta, ...meta }}>
        <FeatureFlagProvider>
          <Router history={history}>{children}</Router>
        </FeatureFlagProvider>
      </MetaContextProvider>
    </QueryClientProvider>
  );
};

const HAPPY_PATH_CONTENT = 'Happy days';

describe(`<SMDatasourceProvider />`, () => {
  it(`should render the child content when the Synthetic Monitoring DS is available`, async () => {
    render(<SMDatasourceProvider>{HAPPY_PATH_CONTENT}</SMDatasourceProvider>, {
      wrapper: Wrapper,
    });

    const content = await screen.findByText(HAPPY_PATH_CONTENT);
    expect(content).toBeInTheDocument();
  });

  it(`should render uninitialized router when there is no Synthetic Monitoring DS available`, async () => {
    jest.spyOn(runTime, 'getDataSourceSrv').mockImplementation(() => {
      return {
        ...jest.requireActual('@grafana/runtime').getDatasourceSrv(),
        get: () => Promise.resolve(),
      };
    });

    render(<SMDatasourceProvider>{HAPPY_PATH_CONTENT}</SMDatasourceProvider>, {
      wrapper: Wrapper,
    });

    const text = await screen.findByText(/Proactively monitor your/);
    expect(text).toBeInTheDocument();
  });
});
