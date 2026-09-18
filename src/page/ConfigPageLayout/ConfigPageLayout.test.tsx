import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ComponentWrapperProps, render } from 'test/render';

import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';

import { CONFIG_TEST_ID } from '../../test/dataTestIds';
import { ConfigPageLayout } from './ConfigPageLayout';

function Wrapper({ children, initialEntries }: ComponentWrapperProps) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path={getRoute(AppRoutes.Config)} element={children}>
          <Route index element={<div data-testid="indexRoute">index</div>} />
          <Route path="access-tokens" element={<div data-testid="indexAccessTokens">access-tokens</div>} />
          <Route path="terraform" element={<div data-testid="terraform">terraform</div>} />
          <Route path="label-migration" element={<div data-testid="labelMigration">label-migration</div>} />
          <Route path="alerts" element={<div data-testid="alerts">alerts</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

function renderPage(path = '') {
  return render(<ConfigPageLayout />, { wrapper: Wrapper, path: getRoute(AppRoutes.Config) + path });
}

describe('ConfigPageLayout', () => {
  it.each([
    ['/', 'indexRoute'],
    ['/access-tokens', 'indexAccessTokens'],
    ['/terraform', 'terraform'],
    ['/label-migration', 'labelMigration'],
    ['/alerts', 'alerts'],
  ])('should render <Outlet /> (path: %s)', (path, testId) => {
    const { getByTestId } = renderPage(path);
    expect(getByTestId(testId)).toBeInTheDocument();
  });

  it.each([
    ['/', 'General'],
    ['/access-tokens', 'Access tokens'],
    ['/terraform', 'Terraform'],
    ['/label-migration', 'Label migration'],
    ['/alerts', 'Alerts (Legacy)'],
  ])('should show the correct active configuration item (path: %s)', (path, text) => {
    const { getByTestId, getByRole } = renderPage(path);
    const activeItem = getByTestId(CONFIG_TEST_ID.layout.activeNavItem);
    expect(activeItem).toBeInTheDocument();
    expect(activeItem).toHaveTextContent(text);
    expect(getByRole('navigation', { name: 'Configuration' })).toContainElement(activeItem);
  });

  it('keeps Configuration selected in the Synthetics tab row', () => {
    const { getByTestId } = renderPage();
    expect(getByTestId(CONFIG_TEST_ID.layout.activeTab)).toHaveTextContent('Configuration');
  });

  it('does not list Probes in the configuration nav', () => {
    const { getByRole, queryByRole } = renderPage();
    const nav = getByRole('navigation', { name: 'Configuration' });

    expect(nav).not.toHaveTextContent('Probes');
    expect(queryByRole('link', { name: /Probes/ })).not.toBeInTheDocument();
  });
});
