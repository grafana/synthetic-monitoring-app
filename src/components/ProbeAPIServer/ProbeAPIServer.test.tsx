import React from 'react';
import { screen } from '@testing-library/react';
import { render } from 'test/render';

import { GRAFANA_DEV_ENTRY } from 'hooks/useProbeApiServer';
import { ProbeAPIServer } from 'components/ProbeAPIServer';

// Mock useBackendAddress for the third test only
jest.mock('hooks/useBackendAddress', () => {
  const originalModule = jest.requireActual('hooks/useBackendAddress');
  return {
    ...originalModule,
    useBackendAddress: jest.fn(),
  };
});

import { useBackendAddress } from 'hooks/useBackendAddress';
const mockUseBackendAddress = useBackendAddress as jest.MockedFunction<typeof useBackendAddress>;

describe('ProbeAPIServer', () => {
  beforeEach(() => {
    // Default behavior for all tests
    mockUseBackendAddress.mockReturnValue(GRAFANA_DEV_ENTRY.backendAddress);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should show the correct probe API server URL', async () => {
    render(<ProbeAPIServer />);
    expect(await screen.findByText(GRAFANA_DEV_ENTRY.apiServerURL)).toBeInTheDocument();
  });

  it(`should show the correct backend address`, async () => {
    render(<ProbeAPIServer />);
    expect(await screen.findByText(GRAFANA_DEV_ENTRY.backendAddress)).toBeInTheDocument();
  });

  it(`should show an error if the probe API server URL is not found`, async () => {
    // Override the mock for this test only
    mockUseBackendAddress.mockReturnValue('non-matching-backend.example.com');

    render(<ProbeAPIServer />);
    expect(await screen.findByRole('alert', { name: /No probe API server found/ })).toBeInTheDocument();
  });
});
