import React from 'react';
import { DataSourceInstanceSettings, DataSourceJsonData } from '@grafana/data';
import { screen, waitFor } from '@testing-library/react';
import { APP_INITIALIZER_TEST_ID } from 'test/dataTestIds';
import { LOGS_DATASOURCE, METRICS_DATASOURCE } from 'test/fixtures/datasources';
import { render } from 'test/render';

import { AppInitializer } from './AppInitializer';
import { DEFAULT_LOGS_DS_UID, DEFAULT_METRICS_DS_UID } from './constants';

const METRICS_NAME = 'test-metrics';
const LOGS_NAME = 'test-logs';

function makeMetricsDs(
  overrides: Partial<DataSourceInstanceSettings<DataSourceJsonData>> = {}
): DataSourceInstanceSettings<DataSourceJsonData> {
  return {
    ...METRICS_DATASOURCE,
    ...overrides,
  };
}

function makeLogsDs(
  overrides: Partial<DataSourceInstanceSettings<DataSourceJsonData>> = {}
): DataSourceInstanceSettings<DataSourceJsonData> {
  return {
    ...LOGS_DATASOURCE,
    ...overrides,
  };
}

const metricsByName = makeMetricsDs({ name: METRICS_NAME, uid: 'metrics-uid' });
const logsByName = makeLogsDs({ name: LOGS_NAME, uid: 'logs-uid' });

function setConfigDatasources(datasources: Record<string, DataSourceInstanceSettings<DataSourceJsonData>>) {
  const runtime = require('@grafana/runtime');
  jest.replaceProperty(runtime, 'config', {
    ...runtime.config,
    datasources: {
      ...datasources,
    },
  });
}

function renderAppInitializer(
  datasources: Record<string, DataSourceInstanceSettings<DataSourceJsonData>>,
  metaOverrides: Record<string, unknown> = {}
) {
  setConfigDatasources(datasources);

  return render(<AppInitializer buttonText="Get started" />, {
    meta: {
      jsonData: {
        metrics: {
          grafanaName: METRICS_NAME,
          hostedId: 100,
        },
        logs: {
          grafanaName: LOGS_NAME,
          hostedId: 200,
        },
        apiHost: 'https://synthetic-monitoring-api.grafana.net',
        stackId: 1,
      },
      ...metaOverrides,
    },
  });
}

async function clickGetStarted(user: ReturnType<typeof render>['user']) {
  const button = await screen.findByTestId(APP_INITIALIZER_TEST_ID.initButton);
  await user.click(button);
}

describe('AppInitializer', () => {
  describe('when both datasources are found by name (Match/NameOnly)', () => {
    it('calls the install endpoint when the button is clicked', async () => {
      const postMock = jest.fn().mockResolvedValue({ accessToken: 'test-token' });
      jest.spyOn(require('@grafana/runtime'), 'getBackendSrv').mockReturnValue({
        post: postMock,
        fetch: jest.fn(),
      });

      const { user } = renderAppInitializer({
        [METRICS_NAME]: metricsByName,
        [LOGS_NAME]: logsByName,
      });

      await clickGetStarted(user);

      await waitFor(() => {
        expect(postMock).toHaveBeenCalledWith(
          expect.stringContaining('/install'),
          expect.objectContaining({
            stackId: 1,
            metricsInstanceId: 100,
            logsInstanceId: 200,
          })
        );
      });
    });
  });

  describe('when metrics datasource is not found', () => {
    it('shows an error message', async () => {
      const { user } = renderAppInitializer({
        [LOGS_NAME]: logsByName,
      });

      await clickGetStarted(user);

      expect(await screen.findByText(/Could not find a metrics datasource/)).toBeInTheDocument();
    });
  });

  describe('when logs datasource is not found', () => {
    it('shows an error message', async () => {
      const { user } = renderAppInitializer({
        [METRICS_NAME]: metricsByName,
      });

      await clickGetStarted(user);

      expect(await screen.findByText(/Could not find a logs datasource/)).toBeInTheDocument();
    });
  });

  describe('when neither datasource is found', () => {
    it('shows a metrics error message', async () => {
      const { user } = renderAppInitializer({});

      await clickGetStarted(user);

      expect(await screen.findByText(/Could not find a metrics datasource/)).toBeInTheDocument();
    });
  });

  describe('when datasources have a UID mismatch', () => {
    it('opens the MismatchedDatasourceModal', async () => {
      const mismatchedLogsByUid = makeLogsDs({ name: 'different-logs-name', uid: DEFAULT_LOGS_DS_UID });

      const { user } = renderAppInitializer({
        [LOGS_NAME]: logsByName,
        [METRICS_NAME]: metricsByName,
        'different-logs-name': mismatchedLogsByUid,
      });

      await clickGetStarted(user);

      expect(await screen.findByText('Datasource selection')).toBeInTheDocument();
    });
  });

  describe('when datasources are found by UID only', () => {
    it('opens the MismatchedDatasourceModal', async () => {
      const metricsByUidOnly = makeMetricsDs({
        name: 'some-other-metrics',
        uid: DEFAULT_METRICS_DS_UID,
      });
      const logsByUidOnly = makeLogsDs({ name: 'some-other-logs', uid: DEFAULT_LOGS_DS_UID });

      const { user } = renderAppInitializer({
        'some-other-metrics': metricsByUidOnly,
        'some-other-logs': logsByUidOnly,
      });

      await clickGetStarted(user);

      expect(await screen.findByText('Datasource selection')).toBeInTheDocument();
    });
  });

  describe('when metricsHostedId is missing', () => {
    it('shows an error about missing hostedId', async () => {
      const { user } = renderAppInitializer(
        {
          [METRICS_NAME]: metricsByName,
          [LOGS_NAME]: logsByName,
        },
        {
          jsonData: {
            metrics: {
              grafanaName: METRICS_NAME,
            },
            logs: {
              grafanaName: LOGS_NAME,
              hostedId: 200,
            },
            apiHost: 'https://synthetic-monitoring-api.grafana.net',
            stackId: 1,
          },
        }
      );

      await clickGetStarted(user);

      expect(await screen.findByText(/Could not find metrics datasource hostedId/)).toBeInTheDocument();
    });
  });

  describe('when logsHostedId is missing', () => {
    it('shows an error about missing hostedId', async () => {
      const { user } = renderAppInitializer(
        {
          [METRICS_NAME]: metricsByName,
          [LOGS_NAME]: logsByName,
        },
        {
          jsonData: {
            metrics: {
              grafanaName: METRICS_NAME,
              hostedId: 100,
            },
            logs: {
              grafanaName: LOGS_NAME,
            },
            apiHost: 'https://synthetic-monitoring-api.grafana.net',
            stackId: 1,
          },
        }
      );

      await clickGetStarted(user);

      expect(await screen.findByText(/Could not find logs datasource hostedId/)).toBeInTheDocument();
    });
  });
});
