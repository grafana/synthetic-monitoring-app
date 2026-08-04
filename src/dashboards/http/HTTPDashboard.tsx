import React, { useMemo, useState } from 'react';
import { GrafanaTheme2, PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DashboardAnnotationsProvider } from 'dashboards/annotations/DashboardAnnotationsProvider';
import { useDashboardContainerAnnotations } from 'dashboards/annotations/useDashboardContainerAnnotations';
import { DashboardAccordion } from 'dashboards/components/DashboardAccordion/DashboardAccordion';
import { useHttpExecutionOverviewExtra } from 'dashboards/http/header/httpExecutionOverview';
import { HttpDashboardPage } from 'dashboards/http/HttpDashboardChrome';
import { DashboardPanel } from 'dashboards/http/panels/DashboardPanel';
import {
  createErrorRateMapPanelDefinition,
  createErrorRatePanelDefinition,
  createResponseLatencyByPhasePanelDefinition,
  createResponseLatencyByProbePanelDefinition,
} from 'dashboards/http/panels/detailPanelDefinitions';
import { PanelTimeRangeFromAppTime } from 'dashboards/runtime/PanelTimeRangeContext';

import { HTTPCheck } from 'types';
import { CheckDashboardProvider } from 'contexts/CheckDashboardProvider';
import { TimepointExplorer } from 'scenes/components/TimepointExplorer/TimepointExplorer';
import { ExecutionResultFilter } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getMinStepFromFrequency } from 'scenes/utils';

function HTTPDashboardBody({ check }: { check: HTTPCheck }) {
  const minStep = getMinStepFromFrequency(check.frequency);
  const styles = useStyles2(getStyles);
  const [resultFilter, setResultFilter] = useState<ExecutionResultFilter>('all');
  const annotations = useDashboardContainerAnnotations(check);
  const overviewExtra = useHttpExecutionOverviewExtra();

  const detailPanels = useMemo(
    () => ({
      errorRateMap: createErrorRateMapPanelDefinition(minStep),
      errorRate: createErrorRatePanelDefinition(minStep),
      responseLatencyByPhase: createResponseLatencyByPhasePanelDefinition('probe_http_duration_seconds'),
      responseLatencyByProbe: createResponseLatencyByProbePanelDefinition(),
    }),
    [minStep]
  );

  return (
    <DashboardAnnotationsProvider check={check} definitions={annotations}>
      <PluginPage pageNav={{ text: check.job }} layout={PageLayoutType.Custom}>
        <HttpDashboardPage check={check}>
          <DashboardAccordion title="Executions">
            <TimepointExplorer
              annotations={annotations}
              check={check}
              onResultFilterChange={setResultFilter}
              overviewExtra={overviewExtra}
              resultFilter={resultFilter}
            />
          </DashboardAccordion>
          <DashboardAccordion title="Performance">
            <div className={styles.errorRateRow}>
              <DashboardPanel definition={detailPanels.errorRateMap} height={500} />
              <DashboardPanel definition={detailPanels.errorRate} height={500} />
            </div>
            <div className={styles.latencyRow}>
              <DashboardPanel definition={detailPanels.responseLatencyByPhase} height={300} />
              <DashboardPanel definition={detailPanels.responseLatencyByProbe} height={300} />
            </div>
          </DashboardAccordion>
        </HttpDashboardPage>
      </PluginPage>
    </DashboardAnnotationsProvider>
  );
}

export function HTTPDashboard({ check }: { check: HTTPCheck }) {
  return (
    <CheckDashboardProvider check={check} urlFormat="canonical">
      <PanelTimeRangeFromAppTime>
        <HTTPDashboardBody check={check} />
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
