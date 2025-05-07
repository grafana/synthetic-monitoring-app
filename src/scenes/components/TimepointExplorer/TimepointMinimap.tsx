import React, { useCallback } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import {
  MinimapSection,
  Timepoint,
  TimepointExplorerChild,
  ViewMode,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getEntryHeight } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

export const TimepointMinimap = ({
  handleTimeRangeToInViewChange,
  miniMapSections,
  ...rest
}: TimepointExplorerChild) => {
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
          <MiniMapSection
            key={index}
            maxProbeDurationData={rest.maxProbeDurationData}
            section={section}
            timepoints={rest.timepoints}
            handleSectionClick={handleSectionClick}
            viewMode={rest.viewMode}
          />
        ))
        .reverse()}
    </Stack>
  );
};

interface MiniMapSectionProps {
  maxProbeDurationData: number;
  section: MinimapSection;
  timepoints: Timepoint[];
  handleSectionClick: (section: MinimapSection) => void;
  viewMode: ViewMode;
}

const MiniMapSection = ({
  maxProbeDurationData,
  section,
  timepoints,
  handleSectionClick,
  viewMode,
}: MiniMapSectionProps) => {
  const styles = getStyles(useTheme2());
  const timepointsToRender = timepoints.slice(section.fromIndex, section.toIndex);

  return (
    <button
      aria-label={`${new Date(section.from).toLocaleTimeString()} - ${new Date(section.to).toLocaleTimeString()}`}
      className={cx(styles.section, { [styles.active]: section.active })}
      onClick={() => handleSectionClick(section)}
    >
      {timepointsToRender.map((timepoint) => {
        const height = getEntryHeight(timepoint.maxProbeDuration, maxProbeDurationData);

        return (
          <div
            key={timepoint.adjustedTime}
            className={cx(styles.timepoint, {
              [styles.success]: timepoint.uptimeValue === 1,
              [styles.failure]: timepoint.uptimeValue === 0,
            })}
            style={{ height }}
          />
        );
      })}
    </button>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  section: css`
    width: 100%;
    padding: 0;
    border: none;
    display: flex;
    height: 40px;
  `,
  active: css`
    outline: 2px solid blue !important;
    z-index: 1;
  `,
  timepoint: css`
    width: 1px;
    min-height: 25%;
    background-color: ${theme.colors.background.primary};
  `,
  success: css`
    background-color: ${theme.colors.success.shade};
  `,
  failure: css`
    background-color: ${theme.colors.error.shade};
  `,
});
