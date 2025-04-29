import React from 'react';
import { render, screen } from '@testing-library/react';

import { SecretsManagementTab } from './SecretsManagementTab';

// Mock a component that throws an error
jest.mock('./SecretsManagementUI', () => {
  return {
    SecretsManagementUI: () => {
      throw new Error('Test error');
    },
  };
});

describe('SecretsManagementTab', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('SecretsManagementTab ErrorBoundary', () => {
    it('should render the fallback UI when an error occurs', () => {
      render(<SecretsManagementTab />);

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/An error has occurred/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });
});
