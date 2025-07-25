import React, { useCallback } from 'react';
import { Box, IconButton, Pagination, Stack, Text } from '@grafana/ui';

import { formatDuration } from 'utils';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useVisibleTimepoints } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { getVisibleTimepointsTimeRange } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { TimepointMiniMapSection } from 'scenes/components/TimepointExplorer/TimepointMinimapSection';

export const TimepointMinimap = () => {
  const { handleMiniMapPageChange, miniMapCurrentPage, miniMapPages } = useTimepointExplorerContext();
  const visibleTimepoints = useVisibleTimepoints();
  const { from, to } = getVisibleTimepointsTimeRange({ timepoints: visibleTimepoints });
  const lengthOfTime = to - from;

  return (
    <Stack direction="column" gap={2}>
      <Text variant="body">{lengthOfTime ? formatDuration(lengthOfTime) : ''} overview</Text>
      <Stack gap={2}>
        <MiniMapNavigation
          disabled={miniMapCurrentPage === miniMapPages.length - 1}
          direction="left"
          onClick={() => {
            handleMiniMapPageChange(miniMapCurrentPage + 1);
          }}
        />
        <Stack direction="column" flex={1}>
          <Box flex={1}>
            <TimepointMinimapContent />
          </Box>
          <Stack direction="row" flex={1} justifyContent="space-between">
            <Text variant="body">{from ? new Date(from).toLocaleString() : ''}</Text>
            <MiniMapPagination miniMapCurrentPage={miniMapCurrentPage} miniMapPages={miniMapPages} />
            <Text variant="body">{to ? new Date(to).toLocaleString() : ''}</Text>
          </Stack>
        </Stack>
        <MiniMapNavigation
          direction="right"
          disabled={miniMapCurrentPage === 0}
          onClick={() => {
            handleMiniMapPageChange(miniMapCurrentPage - 1);
          }}
        />
      </Stack>
    </Stack>
  );
};

const TimepointMinimapContent = () => {
  const { miniMapCurrentPageSections } = useTimepointExplorerContext();

  // todo: fix this
  if (miniMapCurrentPageSections.length === 0) {
    return null;
  }

  return (
    <Box position="relative" paddingY={2}>
      <Stack gap={0}>
        {miniMapCurrentPageSections
          .map((section, index) => <TimepointMiniMapSection index={index} key={index} section={section} />)
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
