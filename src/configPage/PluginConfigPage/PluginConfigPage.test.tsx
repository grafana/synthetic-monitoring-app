import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { CompatRouter, Route, Routes } from 'react-router-dom-v5-compat';
import { render, screen, waitFor, within } from '@testing-library/react';

import { SMDataSource } from '../../datasource/DataSource';
import { DataTestIds } from '../../test/dataTestIds';
import { SM_DATASOURCE } from '../../test/fixtures/datasources';
import { PluginConfigPage } from './PluginConfigPage';
import { getDataSource } from './PluginConfigPage.utils';
jest.mock('./PluginConfigPage.utils');

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <CompatRouter>
        <Routes>
          <Route path="*" element={children} />
        </Routes>
      </CompatRouter>
    </MemoryRouter>
  );
}

async function renderPluginConfigPage(plugin: any) {
  render(<PluginConfigPage plugin={plugin} />, { wrapper: Wrapper });
  await waitFor(() => screen.getByTestId(DataTestIds.TEST_PLUGIN_CONFIG_PAGE), { timeout: 3000 });
}

beforeEach(() => {
  (getDataSource as jest.Mock).mockImplementation(() => Promise.resolve(new SMDataSource(SM_DATASOURCE)));
});

describe('PluginConfigPage', () => {
  describe('app not initialized', () => {
    it('should show initialization required alert', async () => {
      (getDataSource as jest.Mock).mockReturnValue(Promise.resolve(undefined));

      await renderPluginConfigPage({
        meta: {
          enabled: true,
        },
      });

      const alert = screen.queryByTestId('data-testid Alert info');
      const alertTitle = alert && within(alert).getByText('Initialization required');
      const alertLink = alert && within(alert).getByRole('link', { name: 'Synthetic Monitoring app' });
      const goToAppButton = screen.queryByRole('link', { name: 'Go to the Synthetic Monitoring app' });

      expect(alertTitle).toBeInTheDocument();
      expect(alertLink).toBeInTheDocument();
      expect(goToAppButton).toBeInTheDocument();
    });
  });

  describe('plugin enabled', () => {
    const plugin = {
      meta: {
        enabled: true,
      },
    };

    it('should show app home alert', async () => {
      await renderPluginConfigPage(plugin);

      const appHomeAlert = screen.queryByText(/^Are you looking to configure Synthetic Monitoring\?/i);
      expect(appHomeAlert).toBeInTheDocument();
    });

    it('should show app config text with link to config page', async () => {
      await renderPluginConfigPage(plugin);

      const appConfigText = screen.queryByText(/^For app configuration and settings, go to the/);
      const appConfigLink = appConfigText && within(appConfigText).getByRole('link', { name: 'config page' });

      expect(appConfigText).toBeInTheDocument();
      expect(appConfigLink).toBeInTheDocument();
    });

    it('should show goto app button', async () => {
      await renderPluginConfigPage(plugin);

      // It's a `LinkButton` component
      const goToAppButton = screen.queryByRole('link', { name: 'Go to the Synthetic Monitoring app' });
      expect(goToAppButton).toBeInTheDocument();
    });

    it('should NOT show enable button', async () => {
      await renderPluginConfigPage(plugin);

      // It's a `LinkButton` component
      const goToAppButton = screen.queryByRole('button', { name: 'Enable Synthetic Monitoring' });
      expect(goToAppButton).not.toBeInTheDocument();
    });
  });

  describe('plugin disabled', () => {
    const plugin = {
      meta: {
        enabled: false,
      },
    };
    it('should NOT show app home alert', async () => {
      await renderPluginConfigPage(plugin);

      const appHomeAlert = screen.queryByText(/^Are you looking to configure Synthetic Monitoring\?/i);
      expect(appHomeAlert).not.toBeInTheDocument();
    });

    it('should NOT show app config text with link to config page', async () => {
      await renderPluginConfigPage(plugin);

      const appConfigText = screen.queryByText(/^For app configuration and settings, go to the/);
      expect(appConfigText).not.toBeInTheDocument();
    });

    it('should NOT show goto app button', async () => {
      await renderPluginConfigPage(plugin);

      // It's a `LinkButton` component
      const goToAppButton = screen.queryByRole('link', { name: 'Go to the Synthetic Monitoring app' });
      expect(goToAppButton).not.toBeInTheDocument();
    });

    it('should show enable button', async () => {
      await renderPluginConfigPage(plugin);

      // It's a `LinkButton` component
      const goToAppButton = screen.queryByRole('button', { name: 'Enable Synthetic Monitoring' });
      expect(goToAppButton).toBeInTheDocument();
    });
  });

  describe('data sources', () => {
    it('should show data source', async () => {
      await renderPluginConfigPage({
        meta: {
          enabled: true,
        },
      });

      const dataSource = screen.queryByTestId(DataTestIds.TEST_PLUGIN_CONFIG_PAGE_LINKED_DATASOURCES);
      const dataSourceName = dataSource && within(dataSource).getByText(SM_DATASOURCE.type);

      expect(dataSource).toBeInTheDocument();
      expect(dataSourceName).toBeInTheDocument();
    });

    it('should show linked data sources', async () => {
      await renderPluginConfigPage({
        meta: {
          enabled: true,
        },
      });

      const linkedDataSources = screen.queryByTestId(DataTestIds.TEST_PLUGIN_CONFIG_PAGE_LINKED_DATASOURCES);
      const linkedDataSourcesCount =
        linkedDataSources &&
        within(linkedDataSources).getByText(/Linked data sources \(\W?2\W?\)/i, { selector: 'h3' });

      expect(linkedDataSources).toBeInTheDocument();
      expect(linkedDataSourcesCount).toBeInTheDocument();
    });

    it('should indicate missing data source', async () => {
      (getDataSource as jest.Mock).mockReturnValue(
        Promise.resolve(
          new SMDataSource({
            ...SM_DATASOURCE,
            jsonData: {
              ...SM_DATASOURCE.jsonData,
              metrics: {
                ...SM_DATASOURCE.jsonData.metrics,
                uid: '__missing__', // This will result in a missing data source
              },
            },
          })
        )
      );
      await renderPluginConfigPage({
        meta: {
          enabled: true,
        },
      });

      const linkedDataSources = screen.queryByTestId(DataTestIds.TEST_PLUGIN_CONFIG_PAGE_LINKED_DATASOURCES);
      const linkedDataSourcesCount =
        linkedDataSources &&
        within(linkedDataSources).getByText(/Linked data sources \(\W?1\W?\)/i, { selector: 'h3' });
      const missingContainer =
        linkedDataSources &&
        within(linkedDataSources).getByTestId(DataTestIds.TEST_PLUGIN_CONFIG_PAGE_LINKED_DATASOURCES_ERROR);

      expect(linkedDataSources).toBeInTheDocument();
      expect(linkedDataSourcesCount).toBeInTheDocument();
      expect(missingContainer).toBeInTheDocument();
      expect(missingContainer).toHaveTextContent(/Missing the following data source\(s\): prometheus/i);
    });
  });
});
