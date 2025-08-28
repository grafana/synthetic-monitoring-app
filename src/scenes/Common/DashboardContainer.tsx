import React, { PropsWithChildren } from 'react';
import { PluginPage } from '@grafana/runtime';
import { CustomVariable, QueryVariable, SceneContextProvider } from '@grafana/scenes-react';
import { VariableHide, VariableRefresh } from '@grafana/schema';
import { Stack } from '@grafana/ui';

import { Check, CheckType } from 'types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { DEFAULT_QUERY_FROM_TIME } from 'components/constants';
import { useDashboardContainerAnnotations } from 'scenes/Common/DashboardContainer.hooks';
import { DashboardContainerAnnotations } from 'scenes/Common/DashboardContainerAnnotations';
import { DashboardHeader } from 'scenes/Common/DashboardHeader';

interface DashboardContainerProps extends PropsWithChildren {
  check: Check;
  checkType: CheckType;
}

export const DashboardContainer = ({ check, checkType, children }: DashboardContainerProps) => {
  const metricsDS = useMetricsDS();
  const annotations = useDashboardContainerAnnotations(check);

  return (
    <SceneContextProvider timeRange={{ from: `now-${DEFAULT_QUERY_FROM_TIME}`, to: 'now' }} withQueryController>
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
              <Stack direction="column" gap={2}>
                <DashboardContainerAnnotations annotations={annotations}>
                  <DashboardHeader annotations={annotations} check={check} />
                  {children}
                </DashboardContainerAnnotations>
              </Stack>
            </PluginPage>
          </CustomVariable>
        </CustomVariable>
      </QueryVariable>
    </SceneContextProvider>
  );
};
