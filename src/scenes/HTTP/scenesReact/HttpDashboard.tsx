import React from 'react';
import { PluginPage } from '@grafana/runtime';
import {
  AnnotationLayer,
  DataLayerControl,
  RefreshPicker,
  TimeRangePicker,
  VariableControl,
} from '@grafana/scenes-react';
import { LinkButton, Stack } from '@grafana/ui';

import { Check } from 'types';
import { getUserPermissions } from 'data/permissions';
import { useChecks } from 'data/useChecks';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { getUrl } from 'scenes/Common/editButton';
import { getMinStepFromFrequency } from 'scenes/utils';

import { DemoVizLayout } from '../DemoVizLayout';
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
    <PluginPage
      renderTitle={() => <h1>{check.job}</h1>}
      actions={
        <>
          <EditCheckButton job={check.job} instance={check.target} />
          <TimeRangePicker />
          <RefreshPicker /> {/* note: no option to set interval? */}
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
            <>
              <DemoVizLayout>
                <ErrorRateMap minStep={minStep} />
              </DemoVizLayout>
              <DemoVizLayout>
                <UptimeStat check={check} />
                <ReachabilityStat minStep={minStep} />
                <AvgLatency />
                <SSLExpiry />
                <Frequency />
              </DemoVizLayout>

              <DemoVizLayout>
                <ErrorRate minStep={minStep} />
              </DemoVizLayout>

              <DemoVizLayout>
                <ResponseLatency />
                <ResponseLatencyByProbe />
              </DemoVizLayout>

              <DemoVizLayout>
                <ErrorLogs />
              </DemoVizLayout>
            </>
          </AnnotationLayer>
        </AnnotationLayer>
      </Stack>
    </PluginPage>
  );
};

interface Props {
  job: string;
  instance: string;
}

function EditCheckButton({ job, instance }: Props) {
  const { data: checks = [], isLoading } = useChecks();
  const url = getUrl(checks, instance, job);
  const { canWriteChecks } = getUserPermissions();

  return (
    <LinkButton
      variant="secondary"
      href={url}
      disabled={isLoading || !url || !canWriteChecks}
      icon={isLoading ? 'fa fa-spinner' : 'edit'}
    >
      Edit check
    </LinkButton>
  );
}
