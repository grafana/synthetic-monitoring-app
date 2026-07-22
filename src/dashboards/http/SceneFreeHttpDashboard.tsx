import React, { useMemo, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DashboardAnnotationsProvider } from 'dashboards/annotations/DashboardAnnotationsProvider';
import { useDashboardContainerAnnotations } from 'dashboards/annotations/useDashboardContainerAnnotations';
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
import { PanelTimeRangeFromAppTime } from 'dashboards/runtime/PanelTimeRangeContext';

import { FeatureName, HTTPCheck } from 'types';
import { CheckDashboardProvider } from 'contexts/CheckDashboardProvider';
import { FeatureFlag } from 'components/FeatureFlag';
import { TimepointExplorer } from 'scenes/components/TimepointExplorer/TimepointExplorer';
import { ExecutionResultFilter } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getMinStepFromFrequency } from 'scenes/utils';

export function SceneFreeHttpDashboard({ check }: { check: HTTPCheck }) {
  const minStep = getMinStepFromFrequency(check.frequency);
  const styles = useStyles2(getStyles);
  const { unsuccessfulOnly, toggleUnsuccessfulOnly } = useErrorLogsPanelState(true);
  const [resultFilter, setResultFilter] = useState<ExecutionResultFilter>('all');
  const annotations = useDashboardContainerAnnotations(check);

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
        <DashboardAnnotationsProvider check={check} definitions={annotations}>
          <PluginPage pageNav={{ text: check.job }} renderTitle={() => null}>
            <HttpDashboardPage check={check}>
              <TimepointExplorer
                annotations={annotations}
                check={check}
                onResultFilterChange={setResultFilter}
                resultFilter={resultFilter}
              />

              <div className={styles.errorRateRow}>
                <DashboardPanel definition={detailPanels.errorRateMap} height={500} />
                <DashboardPanel definition={detailPanels.errorRate} height={500} />
              </div>

              <div className={styles.latencyRow}>
                <DashboardPanel definition={detailPanels.responseLatencyByPhase} height={300} />
                <DashboardPanel definition={detailPanels.responseLatencyByProbe} height={300} />
              </div>

              <FeatureFlag name={FeatureName.TimepointExplorer}>
                {({ isEnabled }) =>
                  isEnabled ? null : (
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
                  )
                }
              </FeatureFlag>
            </HttpDashboardPage>
          </PluginPage>
        </DashboardAnnotationsProvider>
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
