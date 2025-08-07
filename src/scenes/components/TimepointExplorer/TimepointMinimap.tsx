import React, { useCallback, useRef, useState } from 'react';
import { dateTimeFormat } from '@grafana/data';
import { Box, IconButton, Pagination, Stack, Text } from '@grafana/ui';
import { useResizeObserver } from 'usehooks-ts';

import { formatDuration } from 'utils';
import { MAX_MINIMAP_SECTIONS } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useVisibleTimepoints } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { getVisibleTimepointsTimeRange } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { TimepointMiniMapSection } from 'scenes/components/TimepointExplorer/TimepointMinimapSection';

export const TimepointMinimap = () => {
  const {
    handleMiniMapPageChange,
    handleMiniMapSectionChange,
    miniMapCurrentPage,
    miniMapCurrentSectionIndex,
    miniMapCurrentPageSections,
    miniMapPages,
  } = useTimepointExplorerContext();
  const visibleTimepoints = useVisibleTimepoints();
  const { from, to } = getVisibleTimepointsTimeRange({ timepoints: visibleTimepoints });
  const lengthOfTime = to - from;
  const isLastPage = miniMapCurrentPage === miniMapPages.length - 1;
  const isLastSection = miniMapCurrentSectionIndex === miniMapCurrentPageSections.length - 1;
  const isLastSectionInLastPage = isLastPage && isLastSection;
  const isFirstSectionInFirstPage = miniMapCurrentPage === 0 && miniMapCurrentSectionIndex === 0;

  return (
    <Stack direction="column" gap={2}>
      <Text variant="body">{lengthOfTime ? formatDuration(lengthOfTime) : ''} overview</Text>

      <Stack direction="column">
        <Stack gap={2}>
          <MiniMapNavigation
            disabled={isLastSectionInLastPage}
            direction="left"
            onClick={() => {
              if (isLastSection) {
                handleMiniMapPageChange(miniMapCurrentPage + 1);
                handleMiniMapSectionChange(0);
              } else {
                handleMiniMapSectionChange(miniMapCurrentSectionIndex + 1);
              }
            }}
          />
          <TimepointMinimapContent />
          <MiniMapNavigation
            direction="right"
            disabled={isFirstSectionInFirstPage}
            onClick={() => {
              if (miniMapCurrentSectionIndex === 0) {
                const newPageIndex = miniMapCurrentPage - 1;
                handleMiniMapPageChange(newPageIndex);
                handleMiniMapSectionChange(MAX_MINIMAP_SECTIONS - 1);
              } else {
                handleMiniMapSectionChange(miniMapCurrentSectionIndex - 1);
              }
            }}
          />
        </Stack>
        <Stack direction="row" flex={1} justifyContent="space-between">
          <Text variant="body">{from ? dateTimeFormat(new Date(from)) : ''}</Text>
          <MiniMapPagination miniMapCurrentPage={miniMapCurrentPage} miniMapPages={miniMapPages} />
          <Text variant="body">{to ? dateTimeFormat(to) : ''}</Text>
        </Stack>
      </Stack>
    </Stack>
  );
};

const TimepointMinimapContent = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [miniMapWidth, setMiniMapWidth] = useState<number>(0);
  const { miniMapCurrentPageSections } = useTimepointExplorerContext();
  const filler =
    miniMapCurrentPageSections.length < MAX_MINIMAP_SECTIONS
      ? Array(MAX_MINIMAP_SECTIONS - miniMapCurrentPageSections.length).fill(null)
      : [];

  useResizeObserver({
    // @ts-expect-error
    ref,
    onResize: (element) => {
      setMiniMapWidth(element.width ?? 0);
    },
  });

  return (
    <Box position="relative" paddingY={2} flex={1} ref={ref}>
      <Stack gap={0}>
        {filler.map((_, index) => {
          return <Box key={index} flex={1} />;
        })}
        {miniMapCurrentPageSections
          .map((section, index) => (
            <Box key={index} flex={1}>
              <TimepointMiniMapSection index={index} miniMapWidth={miniMapWidth} section={section} />
            </Box>
          ))
          .reverse()}
      </Stack>
    </Box>
  );
};

interface MiniMapNavigationProps {
  direction: 'left' | 'right';
  disabled: boolean;
  onClick: () => void;
}

const MiniMapNavigation = ({ direction, disabled, onClick }: MiniMapNavigationProps) => {
  const iconName = direction === 'left' ? 'angle-left' : 'angle-right';
  const tooltip = direction === 'left' ? 'Previous page' : 'Next page';

  return <IconButton name={iconName} tooltip={tooltip} onClick={onClick} disabled={disabled} />;
};

interface MiniMapPaginationProps {
  miniMapCurrentPage: number;
  miniMapPages: Array<[number, number]>;
}

const MiniMapPagination = ({ miniMapCurrentPage, miniMapPages }: MiniMapPaginationProps) => {
  const { handleMiniMapPageChange } = useTimepointExplorerContext();
  const numberOfPages = miniMapPages.length;
  const currentPage = numberOfPages - miniMapCurrentPage;

  const handleNavigate = useCallback(
    (page: number) => {
      handleMiniMapPageChange(numberOfPages - page);
    },
    [handleMiniMapPageChange, numberOfPages]
  );

  return <Pagination currentPage={currentPage} numberOfPages={numberOfPages} onNavigate={handleNavigate} />;
};
