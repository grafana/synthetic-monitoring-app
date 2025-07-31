import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { runTestAsSMAdmin, runTestAsSMEditor, runTestAsViewer } from 'test/utils';

import { SecretsManagementTab } from './SecretsManagementTab';

describe('SecretsManagementTab', () => {
  const contactAdminMessage = 'Contact an admin: currently only admins are able to add, view, or remove secrets';

  it('should render the fallback UI when an error occurs', async () => {
    runTestAsSMAdmin();

    server.use(apiRoute('listSecrets', { result: () => ({ status: 500, body: 'Error message' }) }));
    render(<SecretsManagementTab />);

    await waitFor(() => expect(screen.queryByTestId(DataTestIds.CENTERED_SPINNER)).not.toBeInTheDocument(), {
      timeout: 3000,
    });

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/An error has occurred/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  test.each([
    ['viewer', runTestAsViewer],
    ['editor', runTestAsSMEditor],
  ])('displays contact admin message for %s users', async (_, setupFunction) => {
    setupFunction();

    render(<SecretsManagementTab />);

    await waitFor(() => {
      expect(screen.getByText(contactAdminMessage)).toBeInTheDocument();
    });
    expect(screen.queryByTestId(DataTestIds.CENTERED_SPINNER)).not.toBeInTheDocument();
  });

  it('shows secrets management UI for admin users', async () => {
    runTestAsSMAdmin();
    server.use(apiRoute('listSecrets', { result: () => ({ status: 200, json: { secrets: [] } }) }));

    render(<SecretsManagementTab />);

    expect(screen.queryByText(contactAdminMessage)).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create secret/i })).toBeInTheDocument();
    });

    expect(screen.getByText("You don't have any secrets yet.")).toBeInTheDocument();
    expect(screen.getByText(/You can use secrets to store private information/)).toBeInTheDocument();
  });
});
