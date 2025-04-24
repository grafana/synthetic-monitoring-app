import React, { useCallback } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { MinimapSection, TimepointExplorerChild } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export const TimepointMinimap = ({
  viewTimeRangeTo,
  handleTimeRangeToInViewChange,
  miniMapSections,
  timepointsInRange,
  activeSection,
}: TimepointExplorerChild) => {
  const styles = getStyles(useTheme2());

  const handleSectionClick = useCallback(
    (section: MinimapSection) => {
      const newTimeRangeToInView = section.to;
      handleTimeRangeToInViewChange(newTimeRangeToInView);
    },
    [handleTimeRangeToInViewChange]
  );

  // todo: fix this
  if (miniMapSections.length === 0) {
    return null;
  }

  return (
    <Stack gap={0}>
      {miniMapSections
        .map((section, index) => (
          <button
            key={index}
            className={cx(styles.section, { [styles.active]: activeSection?.from === section.from })}
            onClick={() => handleSectionClick(section)}
          >
            {new Date(section.to).toLocaleTimeString()}
          </button>
        ))
        .reverse()}
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  section: css`
    width: 100%;
    padding: 10px;
    border: none;
  `,
  active: css`
    outline: 1px solid blue;
    z-index: 1;
  `,
});
