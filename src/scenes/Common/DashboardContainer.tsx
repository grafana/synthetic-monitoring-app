import React, { PropsWithChildren } from 'react';
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
import { Stack } from '@grafana/ui';

import { Check, CheckType } from 'types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { EditCheckButton } from 'scenes/Common/editButton';

interface DashboardContainerProps extends PropsWithChildren {
  check: Check;
  checkType: CheckType;
}

export const DashboardContainer = ({ check, checkType, children }: DashboardContainerProps) => {
  const metricsDS = useMetricsDS();
  const firingCondition = `{job="$job", instance="$instance", alertstate="firing"}`;
  const pendingCondition = `{job="$job", instance="$instance", alertstate="pending"}`;

  const annotations = [
    {
      datasource: metricsDS,
      expr: `max(ALERTS${firingCondition} or GRAFANA_ALERTS${firingCondition})`,
      hide: false,
      legendFormat: 'alert firing',
      refId: 'alertsAnnotation',
      enable: true,
      iconColor: 'red',
      name: 'Alert firing',
      titleFormat: 'Alert firing',
      step: `10s`,
    },
    {
      datasource: metricsDS,
      expr: `max(ALERTS${pendingCondition} or GRAFANA_ALERTS${pendingCondition})`,
      hide: false,
      legendFormat: 'alert pending',
      refId: 'alertsAnnotation',
      enable: true,
      iconColor: 'yellow',
      name: 'Alert pending',
      titleFormat: 'Alert pending',
      step: `10s`,
    },
  ];

  return (
    <SceneContextProvider timeRange={{ from: 'now-3h', to: 'now' }} withQueryController>
      <QueryVariable
        name="probe"
        isMulti={true}
        query={{
          query: `label_values(sm_check_info{check_name="${checkType}", job="$job", instance="$instance"},probe)`,
          refId: 'A',
        }}
        refresh={VariableRefresh.onDashboardLoad}
        datasource={{ uid: metricsDS?.uid }}
        includeAll={true}
        initialValue={'$__all'}
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
            <PluginPage pageNav={{ text: check.job }} renderTitle={() => <h1>{check.job}</h1>}>
              <Stack direction="column" gap={1}>
                <AnnotationLayer name="Alerts firing" query={annotations[0]}>
                  <AnnotationLayer name="Alerts pending" query={annotations[1]}>
                    <Stack justifyContent="space-between">
                      <Stack direction="row" gap={2}>
                        <VariableControl name="probe" />
                        <DataLayerControl name="Alerts firing" />
                        <DataLayerControl name="Alerts pending" />
                      </Stack>
                      <Stack direction="row" gap={2}>
                        <EditCheckButton id={check.id} />
                        <TimeRangePicker />
                        <RefreshPicker />
                      </Stack>
                    </Stack>
                    {children}
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
