import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { CompatRouter, Route, Routes } from 'react-router-dom-v5-compat';
import { QueryClientProvider } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import { SM_META } from 'test/fixtures/meta';
import { ComponentWrapperProps, render } from 'test/render';
import { runTestWithoutSMAccess } from 'test/utils';

import { hasGlobalPermission } from 'utils';
import { getQueryClient } from 'data/queryClient';
import { FeatureFlagProvider } from 'components/FeatureFlagProvider';

import { MetaContextProvider } from './MetaContext';
import { SMDatasourceProvider } from './SMDatasourceContext';

jest.mock('utils', () => {
  return {
    ...jest.requireActual('utils'),
    hasGlobalPermission: jest.fn().mockReturnValue(true),
  };
});

const Wrapper = ({ children, history, meta }: ComponentWrapperProps) => {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <MetaContextProvider meta={{ ...SM_META, ...meta }}>
        <FeatureFlagProvider>
          <MemoryRouter initialEntries={history.entries}>
            <CompatRouter>
              <Routes>
                <Route path="*" element={children} />
              </Routes>
            </CompatRouter>
          </MemoryRouter>
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
    runTestWithoutSMAccess();

    render(<SMDatasourceProvider>{HAPPY_PATH_CONTENT}</SMDatasourceProvider>, {
      wrapper: Wrapper,
    });

    const text = await screen.findByText(/Proactively monitor your/);
    expect(text).toBeInTheDocument();
  });

  it(`should render uninitialised router and contact admin alert when the user doesn't have SM access or datasource creation permissions`, async () => {
    runTestWithoutSMAccess();
    jest.mocked(hasGlobalPermission).mockReturnValue(false);

    render(<SMDatasourceProvider>{HAPPY_PATH_CONTENT}</SMDatasourceProvider>, {
      wrapper: Wrapper,
    });

    const text = await screen.findByText(/Contact your administrator to get you started./);
    expect(text).toBeInTheDocument();
  });
});
