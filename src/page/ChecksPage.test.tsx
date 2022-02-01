import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { CheckRouter } from './CheckRouter';
import { getInstanceMock } from 'datasource/__mocks__/DataSource';
import userEvent from '@testing-library/user-event';
import { InstanceContext } from 'contexts/InstanceContext';
import { AppPluginMeta } from '@grafana/data';
import { GlobalSettings, ROUTES } from 'types';
import { MemoryRouter, Route } from 'react-router-dom';
import { PLUGIN_URL_PATH } from 'components/constants';

jest.setTimeout(20000);

const renderChecksPage = () => {
  const instance = getInstanceMock();
  const meta = {} as AppPluginMeta<GlobalSettings>;
  render(
    <MemoryRouter initialEntries={[`${PLUGIN_URL_PATH}${ROUTES.Checks}`]}>
      <Route path={`${PLUGIN_URL_PATH}${ROUTES.Checks}`}>
        <InstanceContext.Provider value={{ instance: { api: instance }, loading: false, meta }}>
          <CheckRouter />
        </InstanceContext.Provider>
      </Route>
    </MemoryRouter>
  );
};

test('renders checks', async () => {
  renderChecksPage();
  await waitFor(() => expect(screen.getByText('a jobname')).toBeInTheDocument());
});

test('renders check editor new check', async () => {
  renderChecksPage();
  await waitFor(() => screen.getByRole('button', { name: 'Add new check' }));
  act(() => userEvent.click(screen.getByRole('button', { name: 'Add new check' })));
  expect(await screen.findByText('Add Check')).toBeInTheDocument();
});

test('renders check editor existing check', async () => {
  renderChecksPage();
  const edit = await screen.findByTestId('edit-check-button');
  userEvent.click(edit);
  await waitFor(() => expect(screen.getByText('Edit Check')).toBeInTheDocument());
});
