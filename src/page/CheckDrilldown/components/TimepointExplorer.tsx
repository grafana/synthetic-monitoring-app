import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { dateTime, GrafanaTheme2, IconName, TimeRange } from '@grafana/data';
import { Icon, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { PerCheckLogs } from 'features/parseCheckLogs/checkLogs.types';
import { Timeseries } from 'page/CheckDrilldown/checkDrilldown.types';
import { useCheckDrilldown } from 'page/CheckDrilldown/components/CheckDrilldownContext';
import { PageSelector } from 'page/CheckDrilldown/components/PageSelector';
import { TimepointBar } from 'page/CheckDrilldown/components/TimepointBar';
import { TimepointDetail } from 'page/CheckDrilldown/components/TimepointDetail';
import { createVisualisation } from 'page/CheckDrilldown/components/TimepointExplorer.utils';
import { useTimeRange } from 'page/CheckDrilldown/components/TimeRangeContext';
import { useCheckDrilldownInfo } from 'page/CheckDrilldown/hooks/useCheckDrilldownInfo';
import { useTimepointExplorer } from 'page/CheckDrilldown/hooks/useTimepointExplorer';
import { constructTimepoints } from 'page/CheckDrilldown/utils/constructTimepoints';

const EXPLORER_HEIGHT = 300; // TODO: make this dynamic
const TIMEPOINT_WIDTH = 23 + 8; // 8px is the gap between the timepoints

export const TimepointExplorer = () => {
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<number | null>(null);

  const updateContainerWidth = useCallback(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, []);

  const handleResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      window.clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = window.setTimeout(() => {
      updateContainerWidth();
      resizeTimeoutRef.current = null;
    }, 300);
  }, [updateContainerWidth]);

  useLayoutEffect(() => {
    updateContainerWidth();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      if (resizeTimeoutRef.current) {
        window.clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [handleResize, updateContainerWidth]);

  return (
    <div ref={containerRef}>
      {containerWidth > 0 && (
        <TimepointExplorerData containerWidth={containerWidth - 40 - 16} key={`${containerWidth}`} />
      )}
    </div>
  );
};

const TimepointExplorerData = ({ containerWidth }: { containerWidth: number }) => {
  const timepointsToDisplay = Math.floor(containerWidth / TIMEPOINT_WIDTH);
  const __actual = timepointsToDisplay;
  const { timePointsInRange } = useCheckDrilldownInfo();
  const { timeRange } = useTimeRange();
  const { check } = useCheckDrilldown();

  const pages = Math.ceil(timePointsInRange / __actual);
  const [currentPage, setCurrentPage] = useState(0);

  const displayedTimeRange: TimeRange = useMemo(() => {
    const pageOffset = __actual * check.frequency;
    const toOffset = currentPage * pageOffset;
    const to = dateTime(timeRange.to.valueOf() - toOffset);
    const from = dateTime(timeRange.to.valueOf() - toOffset - pageOffset + check.frequency);

    const adjustedFrom = from < timeRange.from ? timeRange.from : from;

    return { from: adjustedFrom, to, raw: { from: adjustedFrom, to } };
  }, [currentPage, timeRange, check.frequency, __actual]);

  const { timeseries, logs } = useTimepointExplorer(displayedTimeRange);

  const handleNextPage = useCallback(() => {
    setCurrentPage(currentPage + 1);
  }, [currentPage]);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage(currentPage - 1);
  }, [currentPage]);

  const handleGoToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return (
    <TimepointExplorerContent
      containerWidth={containerWidth}
      timeRange={displayedTimeRange}
      timeseries={timeseries}
      perCheckLogs={logs.perCheckLogs}
      onNextPage={handleNextPage}
      onPreviousPage={handlePreviousPage}
      onGoToPage={handleGoToPage}
      currentPage={currentPage}
      totalPages={pages}
      timepointsToDisplay={timepointsToDisplay}
      key={`${containerWidth}-${currentPage}`}
    />
  );
};

const TimepointExplorerContent = ({
  containerWidth,
  timeRange,
  timeseries,
  perCheckLogs,
  onNextPage,
  onPreviousPage,
  onGoToPage,
  currentPage,
  totalPages,
  timepointsToDisplay,
}: {
  containerWidth: number;
  timeRange: TimeRange;
  timeseries: Timeseries;
  perCheckLogs: PerCheckLogs[];
  onNextPage: () => void;
  onPreviousPage: () => void;
  onGoToPage: (page: number) => void;
  currentPage: number;
  totalPages: number;
  timepointsToDisplay: number;
}) => {
  const { check } = useCheckDrilldown();
  const styles = useStyles2(getStyles);
  const { maxDuration, timePointsInRange } = useCheckDrilldownInfo();

  const timePoints = useMemo(() => {
    return constructTimepoints({ check, timeRange, timeseries, perCheckLogs });
  }, [timeRange, check, timeseries, perCheckLogs]);

  const [selectedTimepoint, setSelectedTimepoint] = useState<number | null>(timePoints.length - 1);

  const visualisation = useMemo(
    () => createVisualisation(timePoints, EXPLORER_HEIGHT, maxDuration || 0),
    [timePoints, maxDuration]
  );

  const handleTimepointClick = useCallback((index: number) => {
    setSelectedTimepoint(index);
  }, []);

  const handleCloseTimepointDetail = useCallback(() => {
    setSelectedTimepoint(null);
  }, []);

  const timepointDetail = useMemo(
    () => (selectedTimepoint !== null ? visualisation[selectedTimepoint] : null),
    [selectedTimepoint, visualisation]
  );

  return (
    <Stack direction="column" gap={2}>
      <Stack direction="column" gap={0.5}>
        <Text element="h2" variant="h6">
          Time point Explorer
        </Text>
        <Text
          italic
          variant={`bodySmall`}
        >{`Showing ${visualisation.length} time points of ${timePointsInRange}`}</Text>
      </Stack>
      <div className={styles.container}>
        <ChangePage onClick={onNextPage} icon="arrow-left" disabled={currentPage === totalPages - 1} />
        <div className={styles.timepointContainer}>
          {visualisation.map((timepoint, index) => {
            const isSelected = selectedTimepoint === index;

            return (
              <TimepointBar
                key={timepoint.timestamp}
                timepoint={timepoint}
                onClick={() => {
                  if (isSelected) {
                    handleCloseTimepointDetail();
                  } else {
                    handleTimepointClick(index);
                  }
                }}
                isSelected={isSelected}
              />
            );
          })}
        </div>
        <ChangePage onClick={onPreviousPage} icon="arrow-right" disabled={currentPage === 0} />
      </div>
      <PageSelector
        containerWidth={containerWidth}
        currentPage={currentPage}
        totalPages={totalPages}
        onGoToPage={onGoToPage}
        timepointsToDisplay={timepointsToDisplay}
      />
      {timepointDetail ? (
        <TimepointDetail timepoint={timepointDetail} onClose={handleCloseTimepointDetail} />
      ) : (
        <TimepointZeroState />
      )}
    </Stack>
  );
};

const ChangePage = ({ onClick, icon, disabled }: { onClick: () => void; icon: IconName; disabled: boolean }) => {
  const styles = useStyles2(getStyles);

  return (
    <button className={styles.changePage} onClick={onClick} disabled={disabled}>
      <Icon name={icon} />
    </button>
  );
};

const TimepointZeroState = () => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.zeroState}>
      <Text variant="h2">Select a timepoint to view details.</Text>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: grid;
    grid-template-columns: 20px 1fr 20px;
    gap: ${theme.spacing(1)};
    height: ${EXPLORER_HEIGHT}px;
  `,
  timepointContainer: css`
    align-items: flex-end;
    display: flex;
    flex-direction: row;
    gap: ${theme.spacing(1)};
    width: 100%;
    justify-content: flex-end;
  `,
  zeroState: css`
    border: 1px solid ${theme.colors.border.weak};
    height: 250px;
    padding: ${theme.spacing(2)};
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  `,
  changePage: css`
    background: transparent;
    border: none;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    height: 100%;
    width: 20px;

    &:disabled {
      opacity: 0.5;
    }

    &:hover {
      background: ${theme.colors.action.hover};
    }
  `,
});
