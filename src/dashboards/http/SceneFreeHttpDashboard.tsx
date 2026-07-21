import React, { useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import {
  ErrorLogsPanelHeaderActions,
  HttpDashboardPage,
  useErrorLogsPanelState,
} from 'dashboards/http/HttpDashboardChrome';
import { DashboardPanel } from 'dashboards/http/panels/DashboardPanel';
import {
  createErrorRateMapPanelDefinition,
  createErrorRatePanelDefinition,
  createResponseLatencyByPhasePanelDefinition,
  createResponseLatencyByProbePanelDefinition,
} from 'dashboards/http/panels/detailPanelDefinitions';
import { createErrorLogsPanelDefinition } from 'dashboards/http/panels/errorLogsPanelDefinition';
import {
  createAverageLatencyPanelDefinition,
  createFrequencyPanelDefinition,
  createReachabilityPanelDefinition,
  createSslExpiryPanelDefinition,
  createUptimePanelDefinition,
} from 'dashboards/http/panels/headlinePanelDefinitions';
import { TimepointExplorerSceneBridge } from 'dashboards/http/TimepointExplorerSceneBridge';
import { PanelTimeRangeFromAppTime } from 'dashboards/runtime/PanelTimeRangeContext';

import { Check } from 'types';
import { CheckDashboardProvider } from 'contexts/CheckDashboardProvider';
import { TimepointExplorer } from 'scenes/components/TimepointExplorer/TimepointExplorer';
import { getMinStepFromFrequency } from 'scenes/utils';

export function SceneFreeHttpDashboard({ check }: { check: Check }) {
  const minStep = getMinStepFromFrequency(check.frequency);
  const styles = useStyles2(getStyles);
  const { unsuccessfulOnly, toggleUnsuccessfulOnly } = useErrorLogsPanelState(true);

  const headlinePanels = useMemo(
    () => ({
      uptime: createUptimePanelDefinition(check),
      reachability: createReachabilityPanelDefinition(check),
      averageLatency: createAverageLatencyPanelDefinition(),
      sslExpiry: createSslExpiryPanelDefinition(),
      frequency: createFrequencyPanelDefinition(),
    }),
    [check]
  );

  const detailPanels = useMemo(
    () => ({
      errorRateMap: createErrorRateMapPanelDefinition(minStep),
      errorRate: createErrorRatePanelDefinition(minStep),
      responseLatencyByPhase: createResponseLatencyByPhasePanelDefinition('probe_http_duration_seconds'),
      responseLatencyByProbe: createResponseLatencyByProbePanelDefinition(),
      errorLogs: createErrorLogsPanelDefinition(unsuccessfulOnly),
    }),
    [minStep, unsuccessfulOnly]
  );

  return (
    <CheckDashboardProvider check={check} urlFormat="canonical">
      <PanelTimeRangeFromAppTime>
        <PluginPage pageNav={{ text: check.job }} renderTitle={() => <h1>{check.job}</h1>}>
          <HttpDashboardPage check={check}>
            <Stack height="90px">
              <DashboardPanel definition={{ ...headlinePanels.uptime, title: 'Uptime' }} height={90} />
              <DashboardPanel definition={{ ...headlinePanels.reachability, title: 'Reachability' }} height={90} />
              <DashboardPanel definition={{ ...headlinePanels.averageLatency, title: 'Average latency' }} height={90} />
              <DashboardPanel definition={{ ...headlinePanels.sslExpiry, title: 'SSL Expiry' }} height={90} />
              <DashboardPanel definition={{ ...headlinePanels.frequency, title: 'Frequency' }} height={90} />
            </Stack>

            <TimepointExplorerSceneBridge>
              <TimepointExplorer check={check} />
            </TimepointExplorerSceneBridge>

            <div className={styles.errorRateRow}>
              <DashboardPanel definition={detailPanels.errorRateMap} height={500} />
              <DashboardPanel definition={detailPanels.errorRate} height={500} />
            </div>

            <div className={styles.latencyRow}>
              <DashboardPanel definition={detailPanels.responseLatencyByPhase} height={300} />
              <DashboardPanel definition={detailPanels.responseLatencyByProbe} height={300} />
            </div>

            <DashboardPanel
              definition={detailPanels.errorLogs}
              height={850}
              headerActions={
                <ErrorLogsPanelHeaderActions
                  unsuccessfulOnly={unsuccessfulOnly}
                  onToggle={toggleUnsuccessfulOnly}
                />
              }
            />
          </HttpDashboardPage>
        </PluginPage>
      </PanelTimeRangeFromAppTime>
    </CheckDashboardProvider>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  errorRateRow: css`
    display: grid;
    grid-template-columns: 500px 1fr;
    gap: ${theme.spacing(1)};
    height: 500px;
  `,
  latencyRow: css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${theme.spacing(1)};
    height: 300px;
  `,
});
