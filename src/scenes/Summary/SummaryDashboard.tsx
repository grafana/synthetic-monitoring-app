import React, { useEffect, useMemo, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { AdHocFiltersVariable } from '@grafana/scenes';
import {
  QueryVariable,
  RefreshPicker,
  SceneContextProvider,
  TimeRangePicker,
  useSceneContext,
  VariableControl,
} from '@grafana/scenes-react';
import { VariableRefresh } from '@grafana/schema';
import { Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check } from 'types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { AddNewCheckButton } from 'components/AddNewCheckButton';
import { ChecksEmptyState } from 'components/ChecksEmptyState';
import { DEFAULT_QUERY_FROM_TIME } from 'components/constants';
import { DashboardAnnotationControls } from 'scenes/Common/DashboardAnnotationControls';
import { DashboardContainerAnnotations } from 'scenes/Common/DashboardContainerAnnotations';

import { useSummaryDashboardAnnotations } from './SummaryDashboard.hooks';
import { SummaryErrorPctgViz } from './SummaryErrorPctgViz';
import { SummaryErrorRateMapViz } from './SummaryErrorRateMapViz';
import { SummaryLatencyViz } from './SummaryLatencyViz';
import { SummaryTableViz } from './SummaryTableViz';

interface SummaryDashboardProps {
  checks: Check[];
}

const SummaryDashboardContent = ({ checks }: SummaryDashboardProps) => {
  const metricsDS = useMetricsDS();
  const styles = useStyles2(getStyles);
  const annotations = useSummaryDashboardAnnotations();
  const scene = useSceneContext();
  const [filtersAdded, setFiltersAdded] = useState(false);

  const labelKeys = useMemo(() => {
    return checks.reduce<Set<string>>((acc, check) => {
      check.labels.forEach(({ name }) => {
        acc.add(name);
      });

      return acc;
    }, new Set<string>());
  }, [checks]);

  useEffect(() => {
    if (!metricsDS?.uid) {
      return;
    }

    // Add AdHocFiltersVariable to the scene using the proper addVariable method
    const filters = new AdHocFiltersVariable({
      name: 'Filters',
      datasource: { uid: metricsDS.uid },
      filters: [],
      applyMode: 'manual',
      getTagKeysProvider: () => {
        return Promise.resolve({
          replace: true,
          values: Array.from(labelKeys).map((key) => ({ text: key, value: `label_${key}` })),
        });
      },
    });

    const removeFn = scene.addVariable(filters);
    setFiltersAdded(true);

    return () => {
      removeFn();
      setFiltersAdded(false);
    };
  }, [scene, metricsDS?.uid, labelKeys]);

  if (!filtersAdded) {
    return null;
  }

  return (
    <>
      <PluginPage pageNav={{ text: 'Home' }} renderTitle={() => <h1>Home</h1>}>
        <Stack direction="column" gap={1}>
          <DashboardContainerAnnotations annotations={annotations}>
            <div className={styles.header}>
              <VariableControl name="region" />
              <VariableControl name="probe" />
              <VariableControl name="check_type" />
              <VariableControl name="Filters" />
              <DashboardAnnotationControls annotations={annotations} />
              <div className={styles.spacer} />
              <AddNewCheckButton source="homepage" />
              <TimeRangePicker />
              <RefreshPicker />
            </div>

            <div className={styles.tableRow}>
              <SummaryTableViz />
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
      </PluginPage>
    </>
  );
};

export const SummaryDashboard = ({ checks }: SummaryDashboardProps) => {
  const metricsDS = useMetricsDS();
  const styles = useStyles2(getStyles);

  if (checks.length === 0) {
    return <ChecksEmptyState className={styles.emptyState} />;
  }

  return (
    <SceneContextProvider timeRange={{ from: `now-${DEFAULT_QUERY_FROM_TIME}`, to: 'now' }} withQueryController>
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

