import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import {
  QueryVariable,
  RefreshPicker,
  SceneContextProvider,
  VariableControl,
} from '@grafana/scenes-react';
import { VariableRefresh } from '@grafana/schema';
import { Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { ReliabilityInboxBanner } from 'features/reliabilityInbox';
import { TrackingTimeRangeScope } from 'features/tracking/TrackingTimeRangeScope';

import { Check, FeatureName } from 'types';
import { useDemAssistantContext } from 'hooks/useDemAssistantContext';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { AddNewCheckButton } from 'components/AddNewCheckButton';
import { ChecksEmptyState } from 'components/ChecksEmptyState';
import { DEFAULT_QUERY_FROM_TIME } from 'components/constants';
import { SyntheticsTab } from 'page/SyntheticsPageNav';
import { SyntheticsPluginPage } from 'page/SyntheticsPluginPage';
import { DashboardAnnotationControls } from 'scenes/Common/DashboardAnnotationControls';
import { DashboardContainerAnnotations } from 'scenes/Common/DashboardContainerAnnotations';
import { SceneTimeRangePicker } from 'scenes/Common/SceneTimeRangePicker';

import { useSummaryDashboardAnnotations } from './SummaryDashboard.hooks';
import { SummaryErrorPctgViz } from './SummaryErrorPctgViz';
import { SummaryErrorRateMapViz } from './SummaryErrorRateMapViz';
import { SummaryLatencyViz } from './SummaryLatencyViz';
import { SummaryTableViz } from './SummaryTableViz';
import { useSummaryFilters } from './useSummaryFilters';

interface SummaryDashboardProps {
  checks: Check[];
}

const SummaryDashboardContent = ({ checks }: SummaryDashboardProps) => {
  const metricsDS = useMetricsDS();
  const styles = useStyles2(getStyles);
  const annotations = useSummaryDashboardAnnotations();
  const { isEnabled: isCheckSuggestionsEnabled } = useFeatureFlag(FeatureName.CheckSuggestions);
  const filtersAdded = useSummaryFilters(checks, metricsDS?.uid);

  useDemAssistantContext(checks);

  if (!filtersAdded) {
    return null;
  }

  return (
    <>
      <SyntheticsPluginPage activeTab={SyntheticsTab.Home}>
        <Stack direction="column" gap={1}>
          {isCheckSuggestionsEnabled && <ReliabilityInboxBanner />}
          <DashboardContainerAnnotations annotations={annotations}>
            <div className={styles.header}>
              <VariableControl name="region" />
              <VariableControl name="probe" />
              <VariableControl name="check_type" />
              <VariableControl name="Filters" />
              <DashboardAnnotationControls annotations={annotations} />
              <div className={styles.spacer} />
              <AddNewCheckButton source="homepage" />
              <SceneTimeRangePicker />
              <RefreshPicker />
            </div>

            <div className={styles.tableRow}>
              <SummaryTableViz checks={checks} />
            </div>

            {metricsDS?.uid && (
              <>
                <div className={styles.mapRow}>
                  <SummaryErrorRateMapViz />
                  <SummaryErrorPctgViz />
                </div>

                <div className={styles.latencyRow}>
                  <SummaryLatencyViz />
                </div>
              </>
            )}
          </DashboardContainerAnnotations>
        </Stack>
      </SyntheticsPluginPage>
    </>
  );
};

export const SummaryDashboard = ({ checks }: SummaryDashboardProps) => {
  const metricsDS = useMetricsDS();
  const styles = useStyles2(getStyles);
  const { isEnabled: isCheckSuggestionsEnabled } = useFeatureFlag(FeatureName.CheckSuggestions);

  if (checks.length === 0) {
    return (
      <SyntheticsPluginPage activeTab={SyntheticsTab.Home}>
        <Stack direction="column" gap={1}>
          {isCheckSuggestionsEnabled && <ReliabilityInboxBanner />}
          <ChecksEmptyState className={styles.emptyState} />
        </Stack>
      </SyntheticsPluginPage>
    );
  }

  return (
    <SceneContextProvider timeRange={{ from: `now-${DEFAULT_QUERY_FROM_TIME}`, to: 'now' }} withQueryController>
      <TrackingTimeRangeScope />
      <QueryVariable
        name="probe"
        isMulti={true}
        query={{
          query: `label_values(sm_check_info{},probe)`,
          refId: 'A',
        }}
        refresh={VariableRefresh.onDashboardLoad}
        datasource={{ uid: metricsDS?.uid }}
        includeAll={true}
        initialValue={'$__all'}
      >
        <QueryVariable
          name="region"
          query={{
            query: 'label_values(sm_check_info, region)',
            refId: 'A',
          }}
          datasource={{ uid: metricsDS?.uid }}
          includeAll={true}
          initialValue={'$__all'}
        >
          <QueryVariable
            name="check_type"
            label="check type"
            query={{
              query: 'label_values(sm_check_info, check_name)',
              refId: 'A',
            }}
            datasource={{ uid: metricsDS?.uid }}
            includeAll={true}
            initialValue={'$__all'}
          >
            <SummaryDashboardContent checks={checks} />
          </QueryVariable>
        </QueryVariable>
      </QueryVariable>
    </SceneContextProvider>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  const containerName = 'summary-dashboard-container';
  const breakpoint = theme.breakpoints.values.lg;
  const query = `(max-width: ${breakpoint}px)`;
  const containerQuery = `@container ${containerName} ${query}`;

  return {
    emptyState: css({
      width: '100%',
    }),
    header: css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing(1)};
      container-name: ${containerName};
      container-type: inline-size;
      flex-wrap: wrap;

      ${containerQuery} {
        flex-direction: column;
        align-items: flex-start;
      }
    `,
    spacer: css`
      flex: 1;

      ${containerQuery} {
        display: none;
      }
    `,
    tableRow: css`
      height: 400px;
      min-height: 0;
    `,
    mapRow: css`
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: ${theme.spacing(1)};
      height: 350px;
      min-height: 0;
    `,
    latencyRow: css`
      height: 350px;
      min-height: 0;
    `,
  };
};
