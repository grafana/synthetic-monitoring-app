import React from 'react';
import { screen } from '@testing-library/react';
import { METRICS_DATASOURCE, SM_DATASOURCE } from 'test/fixtures/datasources';
import { render } from 'test/render';
import { runTestWithoutSMAccess } from 'test/utils';

import { GRAFANA_DEV_ENTRY } from 'hooks/useProbeApiServer';
import { ProbeAPIServer } from 'components/ProbeAPIServer/ProbeAPIServer';

// Mock the useGetSMDatasource hook to simulate no datasource found
jest.mock('data/useSMSetup', () => ({
  useGetSMDatasource: jest.fn(),
}));

import { useGetSMDatasource } from 'data/useSMSetup';

const mockUseGetSMDatasource = useGetSMDatasource as jest.MockedFunction<typeof useGetSMDatasource>;

// Create a mock SMDataSource with necessary methods
const createMockSMDataSource = (instanceSettings: any) => ({
  instanceSettings,
  getMetricsDS: jest.fn().mockReturnValue(METRICS_DATASOURCE),
  getLogsDS: jest.fn().mockReturnValue(null),
  // Add other methods as needed
});

describe('ProbeAPIServer', () => {
  beforeEach(() => {
    // Default mock returns SM datasource
    mockUseGetSMDatasource.mockReturnValue({
      data: createMockSMDataSource(SM_DATASOURCE),
      isLoading: false,
      error: null,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should show the correct probe API server URL', async () => {
    render(<ProbeAPIServer />);
    expect(await screen.findByText(GRAFANA_DEV_ENTRY.apiServerURL)).toBeInTheDocument();
  });

  it(`should show the correct backend address`, async () => {
    await render(<ProbeAPIServer />);

    expect(await screen.findByText(GRAFANA_DEV_ENTRY.backendAddress)).toBeInTheDocument();
  });

  it(`should show an error if the probe API server URL is not found`, async () => {
    // Mock the datasource with a backend address that doesn't match any probe mapping
    const mockDatasourceWithNoMapping = {
      ...SM_DATASOURCE,
      jsonData: {
        ...SM_DATASOURCE.jsonData,
        apiHost: 'https://non-matching-backend.example.com',
      },
    };

    mockUseGetSMDatasource.mockReturnValue({
      data: createMockSMDataSource(mockDatasourceWithNoMapping),
      isLoading: false,
      error: null,
    } as any);

    render(<ProbeAPIServer />);
    expect(await screen.findByRole('alert', { name: /No probe API server found/ })).toBeInTheDocument();
  });
});
