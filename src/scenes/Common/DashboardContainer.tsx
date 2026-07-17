import React, { PropsWithChildren, useEffect, useRef } from 'react';
import { PluginPage } from '@grafana/runtime';
import { CustomVariable, QueryVariable, SceneContextProvider } from '@grafana/scenes-react';
import { VariableHide, VariableRefresh } from '@grafana/schema';
import { Stack } from '@grafana/ui';
import { trackCheckDashboardViewed } from 'features/tracking/checkDashboardEvents';

import { Check, CheckType } from 'types';
import { useCheckUptimeSuccessRate } from 'data/useSuccessRates';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { DEFAULT_QUERY_FROM_TIME } from 'components/constants';
import { useDashboardContainerAnnotations } from 'scenes/Common/DashboardContainer.hooks';
import { DashboardContainerAnnotations } from 'scenes/Common/DashboardContainerAnnotations';
import { DashboardHeader } from 'scenes/Common/DashboardHeader';

interface DashboardContainerProps extends PropsWithChildren {
  check: Check;
  checkType: CheckType;
}

const useTrackCheckDashboardViewed = (check: Check, checkType: CheckType) => {
  const { data: uptime, isSuccess, isError } = useCheckUptimeSuccessRate(check);
  const trackedCheckId = useRef<Check['id']>(undefined);

  useEffect(() => {
    if (trackedCheckId.current === check.id || (!isSuccess && !isError)) {
      return;
    }

    trackedCheckId.current = check.id;
    trackCheckDashboardViewed({
      checkType,
      hasFailures: typeof uptime === 'number' ? uptime < 1 : undefined,
      uptime: typeof uptime === 'number' ? Math.round(uptime * 10000) / 100 : undefined,
    });
  }, [check.id, checkType, uptime, isSuccess, isError]);
};

export const DashboardContainer = ({ check, checkType, children }: DashboardContainerProps) => {
  const metricsDS = useMetricsDS();
  const annotations = useDashboardContainerAnnotations(check);
  useTrackCheckDashboardViewed(check, checkType);

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
