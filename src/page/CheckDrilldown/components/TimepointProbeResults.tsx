import React, { Fragment } from 'react';
import { Grid, Stack, Text } from '@grafana/ui';

import { ResultDuration } from 'page/CheckDrilldown/components/ResultDuration';
import { TimepointWithVis } from 'page/CheckDrilldown/components/TimepointExplorer.utils';

export const TimepointProbeResults = ({ timepoint }: { timepoint: TimepointWithVis }) => {
  const { probeDurations, probeSuccesses } = timepoint;

  const resultDurations = Object.entries(probeDurations).map(([probe, duration]) => {
    return {
      probe,
      result: probeSuccesses[probe],
      duration,
    };
  });

  return (
    <Stack>
      <Stack direction={`column`}>
        <Text variant="h6">Probe results</Text>
        <Grid columns={2} gap={0.5}>
          {resultDurations.map(({ probe, result, duration }) => (
            <Fragment key={probe}>
              <Text>{probe}</Text>
              <ResultDuration state={result} duration={duration} type={`success_fail`} />
            </Fragment>
          ))}
        </Grid>
      </Stack>
    </Stack>
  );
};
