import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { TIMEPOINT_WIDTH } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { Timepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

interface TimepointListEntryProps {
  timepoint: Timepoint;
  maxProbeDurationData: number;
}

export const TimepointListEntry = ({ timepoint, maxProbeDurationData }: TimepointListEntryProps) => {
  const styles = getStyles(useTheme2());
  const maxEntryDuration = Object.values(timepoint).reduce((acc, curr) => {
    const duration = Number(curr[LokiFieldNames.Labels].duration_seconds);

    if (duration > acc) {
      return duration * 1000;
    }

    return acc;
  }, 0);

  const height = getEntryHeight(maxEntryDuration, maxProbeDurationData);

  return (
    <div className={styles.timepoint}>
      <div style={{ height }}>{maxEntryDuration}</div>
      <Icon name="check" />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  timepoint: css`
    width: ${TIMEPOINT_WIDTH}px;
    height: 100%;
  `,
});

function getEntryHeight(duration: number, maxProbeDurationData: number) {
  const percentage = (duration / maxProbeDurationData) * 100;

  return `${percentage}%`;
}
