import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { render } from '@testing-library/react';
import { CONFIG_TEST_ID } from 'test/dataTestIds';

import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';

import { CheckListLayout } from './CheckListLayout';

function Wrapper({ initialEntries = ['/'] }: { initialEntries?: string[] }) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path={getRoute(AppRoutes.Checks)} element={<CheckListLayout />}>
          <Route index element={<div data-testid="checksTab">checks</div>} />
          <Route path="recommendations" element={<div data-testid="recommendationsTab">recommendations</div>} />
          <Route path=":id" element={<div data-testid="dashboard">dashboard</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

function renderPage(path = '') {
  return render(<Wrapper initialEntries={[getRoute(AppRoutes.Checks) + path]} />);
}

describe('CheckListLayout', () => {
  it.each([
    ['/', 'checksTab'],
    ['/recommendations', 'recommendationsTab'],
  ])('should render <Outlet /> (path: %s)', (path, testId) => {
    const { getByTestId } = renderPage(path);
    expect(getByTestId(testId)).toBeInTheDocument();
  });

  it.each([
    ['/', 'Checks'],
    ['/recommendations', 'Recommendations'],
  ])('should show correct active tab (path: %s)', (path, text) => {
    const { getByTestId } = renderPage(path);
    const activeTab = getByTestId(CONFIG_TEST_ID.layout.activeTab);
    expect(activeTab).toBeInTheDocument();
    expect(activeTab).toHaveTextContent(text);
  });

  it.each([['/'], ['/recommendations']])('keeps the Synthetics page title (path: %s)', (path) => {
    const { getByRole } = renderPage(path);
    expect(getByRole('heading', { name: 'Synthetics' })).toBeInTheDocument();
  });

  it('does not wrap check dashboards in the Synthetics tabs', () => {
    const { getByTestId, queryByRole, queryByTestId } = renderPage('/99');

    expect(getByTestId('dashboard')).toBeInTheDocument();
    expect(queryByRole('heading', { name: 'Synthetics' })).not.toBeInTheDocument();
    expect(queryByTestId(CONFIG_TEST_ID.layout.activeTab)).not.toBeInTheDocument();
  });
});
