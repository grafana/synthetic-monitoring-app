import React from 'react';
import { PluginPage } from '@grafana/runtime';
import { RefreshPicker, TimeRangePicker, VariableControl } from '@grafana/scenes-react';
import { Stack } from '@grafana/ui';

import { Check } from 'types';
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

  return (
    <PluginPage renderTitle={() => <h1>{check.job}</h1>}>
      <Stack direction="column">
        <Stack direction={'row'}>
          <VariableControl name="probe" />
          <TimeRangePicker />
          <RefreshPicker /> {/* note: no option to set interval? */}
        </Stack>

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
      </Stack>
    </PluginPage>
  );
};
