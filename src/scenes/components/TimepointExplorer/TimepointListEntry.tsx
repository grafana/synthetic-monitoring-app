import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Stack, Tooltip, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { TIMEPOINT_WIDTH } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { Timepoint, UnixTimestamp, ViewMode } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

interface TimepointListEntryProps {
  timepoint: Timepoint;
  maxProbeDurationData: number;
  viewMode: ViewMode;
}

export const TimepointListEntry = ({ timepoint, maxProbeDurationData, viewMode }: TimepointListEntryProps) => {
  const styles = getStyles(useTheme2());

  return (
    <div className={styles.timepoint}>
      {viewMode === 'uptime' ? (
        <UptimeEntry maxProbeDurationData={maxProbeDurationData} timepoint={timepoint} />
      ) : (
        <ReachabilityEntry maxProbeDurationData={maxProbeDurationData} timepoint={timepoint} />
      )}
    </div>
  );
};

const UptimeEntry = ({ maxProbeDurationData, timepoint }: { maxProbeDurationData: number; timepoint: Timepoint }) => {
  const probeValues = Object.values(timepoint);

  const maxEntryDuration = probeValues.reduce((acc, curr) => {
    const duration = Math.round(Number(curr[LokiFieldNames.Labels].duration_seconds) * 1000);

    if (duration > acc) {
      return duration;
    }

    return acc;
  }, 0);

  const height = getEntryHeight(maxEntryDuration, maxProbeDurationData);
  const styles = getStyles(useTheme2());

  return (
    <Tooltip content={<TimepointTooltipContent time={probeValues[0]?.adjustedTime} value={`${maxEntryDuration}ms`} />}>
      <div className={styles.uptimeEntry} style={{ height }}>
        <Icon name="check" />
      </div>
    </Tooltip>
  );
};

const ReachabilityEntry = ({
  maxProbeDurationData,
  timepoint,
}: {
  maxProbeDurationData: number;
  timepoint: Timepoint;
}) => {
  const styles = getStyles(useTheme2());
  const probeValues = Object.values(timepoint);

  return probeValues.map((probeValue) => {
    const duration = Number(probeValue[LokiFieldNames.Labels].duration_seconds) * 1000;
    const height = getEntryHeight(duration, maxProbeDurationData);

    return (
      <Tooltip
        content={<TimepointTooltipContent time={probeValue.adjustedTime} value={`${duration}ms`} />}
        key={probeValue.probe}
      >
        <div className={styles.reachabilityEntry} style={{ bottom: height }}>
          <Icon name="check" />
        </div>
      </Tooltip>
    );
  });
};

const TimepointTooltipContent = ({ time, value }: { time: UnixTimestamp; value: string }) => {
  const displayTime = new Date(time).toLocaleString();

  return (
    <Stack direction={`column`}>
      <div>{displayTime}</div>
      <div>{value}</div>
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  timepoint: css`
    display: flex;
    justify-content: end;
    flex-direction: column;
    width: ${TIMEPOINT_WIDTH}px;
    height: 100%;
    position: relative;
  `,
  uptimeEntry: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: end;
    background-color: green;
    width: 100%;
  `,
  reachabilityEntry: css`
    position: absolute;
  `,
});

function getEntryHeight(duration: number, maxProbeDurationData: number) {
  const percentage = (duration / maxProbeDurationData) * 100;

  return `${percentage}%`;
}
