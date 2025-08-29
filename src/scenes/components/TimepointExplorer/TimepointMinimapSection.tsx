import React, { useCallback, useRef } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Tooltip, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { trackMiniMapSectionClicked } from 'features/tracking/timepointExplorerEvents';

import { PlainButton } from 'components/PlainButton';
import {
  MAX_MINIMAP_SECTIONS,
  MINIMAP_SECTION_HEIGHT,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { MiniMapSection } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { TimepointExplorerAnnotations } from 'scenes/components/TimepointExplorer/TimepointExplorerAnnotations';
import { getLabel } from 'scenes/components/TimepointExplorer/TimepointMinimapSection.utils';
import { TimepointMinimapSectionCanvas } from 'scenes/components/TimepointExplorer/TimepointMinimapSectionCanvas';

interface MiniMapSectionProps {
  index: number;
  miniMapWidth: number;
  section: MiniMapSection;
}

export const TimepointMiniMapSection = ({ index, miniMapWidth, section }: MiniMapSectionProps) => {
  const {
    handleMiniMapSectionChange,
    miniMapCurrentSectionIndex,
    miniMapCurrentPageSections,
    timepointsDisplayCount,
    timepoints,
  } = useTimepointExplorerContext();
  const styles = useStyles2(getStyles);
  const [start, end] = section;
  const miniMapSectionTimepoints = timepoints.slice(start, end + 1);
  const ref = useRef<HTMLButtonElement>(null);
  const label = getLabel(miniMapSectionTimepoints);
  const isActive = miniMapCurrentSectionIndex === index;
  const sectionWidth = miniMapWidth / MAX_MINIMAP_SECTIONS;
  const entryWidth = sectionWidth / timepointsDisplayCount;
  const isBeginningSection = index === miniMapCurrentPageSections.length - 1;

  const handleMiniMapSectionClick = useCallback(() => {
    trackMiniMapSectionClicked({
      index,
      component: 'section',
    });
    handleMiniMapSectionChange(index);
  }, [index, handleMiniMapSectionChange]);

  return (
    <Tooltip content={label} ref={ref}>
      <PlainButton
        aria-label={label}
        className={cx(styles.section, { [styles.active]: isActive })}
        onClick={handleMiniMapSectionClick}
        ref={ref}
      >
        <TimepointExplorerAnnotations
          displayWidth={entryWidth}
          isBeginningSection={isBeginningSection}
          parentWidth={sectionWidth}
          showTooltips={false}
          timepointsInRange={miniMapSectionTimepoints}
          triggerHeight={2}
        />
        <TimepointMinimapSectionCanvas
          timepoints={miniMapSectionTimepoints}
          width={sectionWidth}
          height={MINIMAP_SECTION_HEIGHT}
        />
      </PlainButton>
    </Tooltip>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  section: css`
    width: 100%;
    padding: 0;
    border: none;
    display: flex;
    height: ${MINIMAP_SECTION_HEIGHT}px;
    align-items: end;
    background-color: transparent;
    justify-content: end;
    position: relative;
    z-index: 1;

    &:before,
    &:after {
      content: '';
      height: 160%;
      left: 0;
      pointer-events: none;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 100%;
    }

    &:before {
      z-index: -1;
    }

    &:hover:before {
      background-color: ${theme.colors.background.secondary};
    }
  `,
  active: css`
    &:before {
      background-color: ${theme.colors.background.secondary};
    }

    &:after {
      border: 1px solid ${theme.colors.warning.border};
    }
  `,
});
