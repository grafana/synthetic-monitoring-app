import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { TIMEPOINT_WIDTH } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { Timepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

interface TimepointListEntryProps {
  timepoint: Timepoint;
}

export const TimepointListEntry = ({ timepoint }: TimepointListEntryProps) => {
  const styles = getStyles(useTheme2());
  const probes = Object.keys(timepoint);

  return (
    <div className={styles.timepoint}>
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
