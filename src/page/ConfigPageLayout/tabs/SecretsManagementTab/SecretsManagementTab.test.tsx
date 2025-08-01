import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { 
  runTestAsSecretsCreator,
  runTestAsSecretsEditor,
  runTestAsSecretsFullAccess,
  runTestAsSecretsNoAccess,
  runTestAsSecretsReadOnly,
  runTestAsSMAdmin, 
  runTestAsSMEditor, 
  runTestAsViewer} from 'test/utils';

import { SecretsManagementTab } from './SecretsManagementTab';

describe('SecretsManagementTab', () => {
  describe('Admin/Editor/Viewer permissions (no RBAC)', () => {
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

    it.each([
      ['viewer', runTestAsViewer],
      ['editor', runTestAsSMEditor],
    ])('displays contact admin message for %s users without secrets access', async (_, setupFunction) => {
      setupFunction();

      render(<SecretsManagementTab />);

      await waitFor(() => {
        expect(screen.getByText(/Contact an admin: you don't have permissions to view secrets/)).toBeInTheDocument();
      });
      expect(screen.getByText('secret.securevalues:read')).toBeInTheDocument();
      expect(screen.queryByTestId(DataTestIds.CENTERED_SPINNER)).not.toBeInTheDocument();
    });

    it('shows secrets management UI for admin users', async () => {
      runTestAsSMAdmin();
      server.use(apiRoute('listSecrets', { result: () => ({ status: 200, json: { secrets: [] } }) }));

      render(<SecretsManagementTab />);

      expect(screen.queryByText(/Contact an admin/)).not.toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create secret/i })).toBeInTheDocument();
      });

      expect(screen.getByText("You don't have any secrets yet.")).toBeInTheDocument();
      expect(screen.getByText(/You can use secrets to store private information/)).toBeInTheDocument();
    });
  });

  describe('RBAC permissions', () => {
    beforeEach(() => {
      server.use(apiRoute('listSecrets', { result: () => ({ status: 200, json: { secrets: [] } }) }));
    });

    it('allows full access for users with all secret permissions', async () => {
      runTestAsSecretsFullAccess();

      render(<SecretsManagementTab />);

      expect(screen.queryByText(/Contact an admin/)).not.toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create secret/i })).toBeInTheDocument();
      });

      expect(screen.getByText("You don't have any secrets yet.")).toBeInTheDocument();
    });

    it('allows access for users with read-only permissions', async () => {
      runTestAsSecretsReadOnly();

      render(<SecretsManagementTab />);

      expect(screen.queryByText(/Contact an admin/)).not.toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText("You don't have any secrets yet.")).toBeInTheDocument();
      });

      // Should not show create button for read-only users
      expect(screen.queryByRole('button', { name: /create secret/i })).not.toBeInTheDocument();
    });

    it('allows access for users with creator permissions', async () => {
      runTestAsSecretsCreator();

      render(<SecretsManagementTab />);

      expect(screen.queryByText(/Contact an admin/)).not.toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create secret/i })).toBeInTheDocument();
      });

      expect(screen.getByText("You don't have any secrets yet.")).toBeInTheDocument();
    });

    it('allows access for users with editor permissions', async () => {
      runTestAsSecretsEditor();

      render(<SecretsManagementTab />);

      expect(screen.queryByText(/Contact an admin/)).not.toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText("You don't have any secrets yet.")).toBeInTheDocument();
      });

      // Should not show create button for editor-only users (they can only edit existing secrets)
      expect(screen.queryByRole('button', { name: /create secret/i })).not.toBeInTheDocument();
    });

    it('denies access for users with no secret permissions', async () => {
      runTestAsSecretsNoAccess();

      render(<SecretsManagementTab />);

      await waitFor(() => {
        expect(screen.getByText(/Contact an admin: you don't have permissions to view secrets/)).toBeInTheDocument();
      });
      expect(screen.getByText('secret.securevalues:read')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /create secret/i })).not.toBeInTheDocument();
    });
  });
});
