import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { SecretsManagementTab } from './SecretsManagementTab';

describe('SecretsManagementTab', () => {
  it('should render the fallback UI when an error occurs', async () => {
    server.use(apiRoute('listSecrets', { result: () => ({ status: 500, body: 'Error message' }) }));
    render(<SecretsManagementTab />);
    await waitFor(() => expect(screen.queryByTestId(DataTestIds.CENTERED_SPINNER)).not.toBeInTheDocument(), {
      timeout: 3000,
    });

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/An error has occurred/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
