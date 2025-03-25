import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import {
  AnnotationLayer,
  CustomVariable,
  DataLayerControl,
  QueryVariable,
  RefreshPicker,
  SceneContextProvider,
  TimeRangePicker,
  VariableControl,
} from '@grafana/scenes-react';
import { VariableHide, VariableRefresh } from '@grafana/schema';
import { Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, CheckType } from 'types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { EditCheckButton } from 'scenes/Common/editButton';
import { getMinStepFromFrequency } from 'scenes/utils';

import { AvgLatency } from './stats/AvgLatencyViz';
import { Frequency } from './stats/FrequencyViz';
import { ReachabilityStat } from './stats/ReachabilityStatViz';
import { SSLExpiry } from './stats/SSLExpiryViz';
import { UptimeStat } from './stats/UptimeStatViz';
import { ErrorLogs } from './ErrorLogs';
import { ErrorRateMap } from './ErrorRateMap';
import { ErrorRate } from './ErrorRateViz';
import { ResponseLatency } from './ResponseLatency';
import { ResponseLatencyByProbe } from './ResponseLatencyByProbe';

export const HttpDashboard = ({ check }: { check: Check }) => {
  const minStep = getMinStepFromFrequency(check.frequency);
  const metricsDS = useMetricsDS();
  const styles = useStyles2(getStyles);

  const annotations = [
    {
      datasource: metricsDS,
      expr: 'max(ALERTS{job="$job", instance="$instance", alertstate="firing"})',
      hide: false,
      legendFormat: 'alert firing',
      refId: 'alertsAnnotation',
      enable: true,
      iconColor: 'red',
      name: 'Alert firing',
      titleFormat: 'Alert firing',
    },
    {
      datasource: metricsDS,
      expr: 'max(ALERTS{job="$job", instance="$instance", alertstate="pending"})',
      hide: false,
      legendFormat: 'alert firing',
      refId: 'alertsAnnotation',
      enable: true,
      iconColor: 'yellow',
      name: 'Alert pending',
      titleFormat: 'Alert pending',
    },
  ];

  return (
    <SceneContextProvider timeRange={{ from: 'now-1h', to: 'now' }} withQueryController>
      <QueryVariable
        name="probe"
        isMulti={true}
        query={{ query: `label_values(sm_check_info{check_name="${CheckType.HTTP}"},probe)`, refId: 'A' }}
        refresh={VariableRefresh.onDashboardLoad}
        datasource={{ uid: metricsDS?.uid }}
        regex={'.*'}
        includeAll={true}
        initialValue={'all'}
      >
        <CustomVariable
          name="job"
          query={check.job}
          initialValue={check.job}
          label={check.job}
          hide={VariableHide.hideVariable}
        >
          <CustomVariable
            name="instance"
            query={check.target}
            initialValue={check.target}
            label={check.target}
            hide={VariableHide.hideVariable}
          >
            <PluginPage
              renderTitle={() => <h1>{check.job}</h1>}
              actions={
                <>
                  <EditCheckButton id={check.id} />
                  <TimeRangePicker />
                  <RefreshPicker />
                </>
              }
            >
              <Stack direction="column">
                <AnnotationLayer name="Alerts firing" query={annotations[0]}>
                  <AnnotationLayer name="Alerts pending" query={annotations[1]}>
                    <Stack direction="row">
                      <VariableControl name="probe" />
                      <DataLayerControl name="Alerts firing" />
                      <DataLayerControl name="Alerts pending" />
                    </Stack>

                    <div className={styles.vizLayout}>
                      <div className={styles.errorRateMap}>
                        <ErrorRateMap minStep={minStep} />
                      </div>

                      <div className={styles.nestedGrid}>
                        <div className={styles.statsRow}>
                          <UptimeStat check={check} />
                          <ReachabilityStat minStep={minStep} />
                          <AvgLatency />
                          <SSLExpiry />
                          <Frequency />
                        </div>

                        <div className={styles.errorRateTimeseries}>
                          <SceneContextProvider timeRange={{ from: 'now-10m', to: 'now' }}>
                            <ErrorRate minStep={minStep} />
                          </SceneContextProvider>
                        </div>
                      </div>

                      <div className={styles.latencyRow}>
                        <div className={styles.latencyPanel}>
                          <ResponseLatency />
                        </div>
                        <div className={styles.latencyPanel}>
                          <ResponseLatencyByProbe />
                        </div>
                      </div>

                      <div className={styles.errorLogs}>
                        <ErrorLogs />
                      </div>
                    </div>
                  </AnnotationLayer>
                </AnnotationLayer>
              </Stack>
            </PluginPage>
          </CustomVariable>
        </CustomVariable>
      </QueryVariable>
    </SceneContextProvider>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  vizLayout: css({
    display: 'grid',
    gridTemplateColumns: '500px 1fr',
    gridTemplateRows: 'auto auto auto',
    columnGap: '8px',
    rowGap: '8px',
    height: '100%',
  }),
  errorRateMap: css({
    width: '500px',
    height: '500px',
  }),
  nestedGrid: css({
    display: 'grid',
    gridTemplateRows: '90px 1fr',
    height: '500px',
    rowGap: '8px',
  }),
  statsRow: css({
    display: 'flex',
    justifyContent: 'space-between',
    height: '90px',
    gap: '8px',
  }),
  errorRateTimeseries: css({
    height: 'calc(100% - 32px)',
    flexGrow: 1,
  }),
  latencyRow: css({
    gridColumn: 'span 2',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridAutoRows: '300px',
    gap: '8px',
  }),
  latencyPanel: css({
    height: '300px',
  }),
  errorLogs: css({
    gridColumn: 'span 2',
    height: '500px',
  }),
});
