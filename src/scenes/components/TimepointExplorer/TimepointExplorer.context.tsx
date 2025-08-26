import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { TimeRange } from '@grafana/data';
import { useTimeRange } from '@grafana/scenes-react';
import { useTheme2 } from '@grafana/ui';

import { Check } from 'types';
import { useLogsRetentionPeriod } from 'data/useLogsRetention';
import { useSceneVar } from 'scenes/Common/useSceneVar';
import {
  MAX_MINIMAP_SECTIONS,
  TIMEPOINT_EXPLORER_VIEW_OPTIONS,
  TIMEPOINT_GAP_PX,
  TIMEPOINT_SIZE,
  VIZ_DISPLAY_OPTIONS,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  useBuiltCheckConfigs,
  useCurrentAdjustedTime,
  useExecutionDurationLogs,
  useIsInitialised,
  useIsListResultPending,
  usePersistedMaxProbeDuration,
  useTimepoints,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import {
  CheckConfig,
  CheckEvent,
  HoveredState,
  MiniMapPages,
  MiniMapSection,
  MiniMapSections,
  StatefulTimepoint,
  StatelessTimepoint,
  TimepointStatus,
  UnixTimestamp,
  ViewerState,
  ViewMode,
  VizDisplay,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  buildCheckEvents,
  findNearestPageIndex,
  getExplorerTimeFrom,
  getMiniMapPages,
  getMiniMapSections,
  getVisibleTimepoints,
  getVisibleTimepointsTimeRange,
  getYAxisMax,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

interface TimepointExplorerContextType {
  check: Check;
  checkConfigs: CheckConfig[];
  checkEvents: CheckEvent[];
  currentAdjustedTime: UnixTimestamp;
  explorerTimeFrom: UnixTimestamp;
  handleHoverStateChange: (state: HoveredState) => void;
  handleListWidthChange: (listWidth: number, currentSectionRange: MiniMapSection) => void;
  handleMiniMapPageChange: (page: number) => void;
  handleMiniMapSectionChange: (sectionIndex: number) => void;
  handleRefetch: () => void;
  handleTimepointWidthChange: (timepointWidth: number, currentSectionRange: MiniMapSection) => void;
  handleViewerStateChange: (state: ViewerState) => void;
  handleViewModeChange: (viewMode: ViewMode) => void;
  handleVizDisplayChange: (display: TimepointStatus, usedModifier: boolean) => void;
  handleVizOptionChange: (display: TimepointStatus, color: string) => void;
  hoveredState: HoveredState;
  isError: boolean;
  isFetching: boolean;
  isInitialised: boolean;
  isLoading: boolean;
  isLogsRetentionPeriodWithinTimerange: boolean;
  listLogsMap: Record<UnixTimestamp, StatefulTimepoint>;
  listWidth: number;
  miniMapCurrentPage: number;
  miniMapCurrentPageSections: MiniMapSections;
  miniMapCurrentSectionIndex: number;
  miniMapPages: MiniMapPages;
  timepoints: StatelessTimepoint[];
  timepointsDisplayCount: number;
  timepointWidth: number;
  viewerState: ViewerState;
  viewMode: ViewMode;
  vizDisplay: VizDisplay;
  vizOptions: Record<TimepointStatus, string>;
  yAxisMax: number;
}

export const TimepointExplorerContext = createContext<TimepointExplorerContextType | null>(null);

interface TimepointExplorerProviderProps extends PropsWithChildren {
  check: Check;
}

export const TimepointExplorerProvider = ({ children, check }: TimepointExplorerProviderProps) => {
  const checkCreation = check.created!;
  const [timeRange] = useTimeRange();
  const timeRangeRef = useRef<TimeRange>(timeRange);
  const logsRetentionPeriod = useLogsRetentionPeriod(timeRange.from.valueOf());
  // eslint-disable-next-line react-hooks/exhaustive-deps -- update date.now when timerange changes
  const logsRetentionFrom = useMemo(() => Date.now() - logsRetentionPeriod, [logsRetentionPeriod, timeRange]);
  const explorerTimeFrom = getExplorerTimeFrom({
    checkCreation,
    logsRetentionFrom,
    timeRangeFrom: timeRange.from.valueOf(),
  });
  const [miniMapCurrentPage, setMiniMapPage] = useState(0);
  const [hoveredState, setHoveredState] = useState<HoveredState>([]);
  const [miniMapCurrentSectionIndex, setMiniMapCurrentSectionIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>(TIMEPOINT_EXPLORER_VIEW_OPTIONS[0].value);
  const [timepointsDisplayCount, setTimepointsDisplayCount] = useState<number>(0);
  const theme = useTheme2();
  const currentAdjustedTime = useCurrentAdjustedTime(check);
  const [vizDisplay, setVizDisplay] = useState<VizDisplay>(VIZ_DISPLAY_OPTIONS);
  const [vizOptions, setVizOptions] = useState<Record<TimepointStatus, string>>({
    success: theme.visualization.getColorByName(`green`),
    failure: theme.visualization.getColorByName(`red`),
    missing: theme.visualization.getColorByName(`gray`),
    pending: theme.visualization.getColorByName(`blue`),
  });
  const [listWidth, setListWidth] = useState<number>(0);
  const [timepointWidth, setTimepointWidth] = useState<number>(TIMEPOINT_SIZE);
  const probeVarRaw = useSceneVar('probe');

  const {
    data: maxProbeDurationData,
    isError: isMaxProbeDurationError,
    isFetching: isMaxProbeDurationFetching,
    isLoading: isMaxProbeDurationLoading,
    refetch: refetchMaxProbeDuration,
  } = usePersistedMaxProbeDuration({
    check,
    probe: probeVarRaw,
    from: explorerTimeFrom,
    to: timeRange.to.valueOf(),
  });

  useEffect(() => {
    timeRangeRef.current = timeRange;
  }, [timeRange]);

  const yAxisMax = getYAxisMax(maxProbeDurationData, check.timeout);

  const {
    checkConfigs,
    isError: isCheckConfigsError,
    isFetching: isCheckConfigsFetching,
    isLoading: isCheckConfigsLoading,
    refetch: refetchCheckConfigs,
  } = useBuiltCheckConfigs({
    check,
    probe: probeVarRaw,
    from: explorerTimeFrom,
    to: timeRange.to.valueOf(),
  });

  const checkEvents = useMemo(
    () =>
      buildCheckEvents({
        checkConfigs,
        from: explorerTimeFrom,
      }),
    [checkConfigs, explorerTimeFrom]
  );

  const timepoints = useTimepoints({ checkConfigs, limitFrom: explorerTimeFrom, limitTo: timeRange.to.valueOf() });
  const isLogsRetentionPeriodWithinTimerange = logsRetentionFrom > timeRange.from.valueOf();

  const miniMapPages = useMemo(
    () => getMiniMapPages(timepoints.length, timepointsDisplayCount, MAX_MINIMAP_SECTIONS),
    [timepoints, timepointsDisplayCount]
  );

  const visibleTimepoints = useMemo(
    () => getVisibleTimepoints({ timepoints, miniMapCurrentPage, miniMapPages }),
    [timepoints, miniMapCurrentPage, miniMapPages]
  );
  const miniMapCurrentPageTimeRange = useMemo(
    () => getVisibleTimepointsTimeRange({ timepoints: visibleTimepoints }),
    [visibleTimepoints]
  );
  const miniMapCurrentPageSections = useMemo(() => {
    // going from a non-overlapping time range to another one, reset everything
    if (timeRangeRef.current.from !== timeRange.from || timeRangeRef.current.to !== timeRange.to) {
      setMiniMapPage(0);
      setMiniMapCurrentSectionIndex(0);

      return getMiniMapSections(miniMapPages[0], timepointsDisplayCount);
    }

    return getMiniMapSections(miniMapPages[miniMapCurrentPage], timepointsDisplayCount);
  }, [miniMapPages, miniMapCurrentPage, timepointsDisplayCount, timeRange.from, timeRange.to]);

  const {
    isFetching: isExecutionDurationLogsFetching,
    isLoading: isExecutionDurationLogsLoading,
    isError: isExecutionDurationLogsError,
    listLogsMap,
    refetch: refetchEndingLogs,
  } = useExecutionDurationLogs({
    check,
    probe: probeVarRaw,
    timepoints: visibleTimepoints, // no point building anything that is not visible
    timeRange: miniMapCurrentPageTimeRange,
  });

  const isLoading = isCheckConfigsLoading || isExecutionDurationLogsLoading || isMaxProbeDurationLoading;
  const isFetching = isCheckConfigsFetching || isExecutionDurationLogsFetching || isMaxProbeDurationFetching;
  const isError = isCheckConfigsError || isExecutionDurationLogsError || isMaxProbeDurationError;

  const [viewerState, setViewerState] = useState<ViewerState>([]);

  const handleMiniMapSectionChange = useCallback((sectionIndex: number) => {
    setMiniMapCurrentSectionIndex(sectionIndex);
  }, []);

  const handleMiniMapPageChange = useCallback((page: number) => {
    setMiniMapPage(page);
    setMiniMapCurrentSectionIndex(0);
  }, []);

  const handleViewModeChange = useCallback((viewMode: ViewMode) => {
    setViewMode(viewMode);
  }, []);

  const handleViewerStateChange = useCallback((state: ViewerState) => {
    setViewerState(state);
  }, []);

  const handleTimepointDisplayCountChange = useCallback(
    (count: number, currentSectionRange: MiniMapSection) => {
      const newMiniMapPages = getMiniMapPages(timepoints.length, count, MAX_MINIMAP_SECTIONS);
      const nearestPage = findNearestPageIndex(newMiniMapPages, currentSectionRange);
      const newMiniMapSections = getMiniMapSections(newMiniMapPages[nearestPage], count);
      const nearestSection = findNearestPageIndex(newMiniMapSections, currentSectionRange);
      setTimepointsDisplayCount(count);
      setMiniMapPage(nearestPage);
      setMiniMapCurrentSectionIndex(nearestSection);
    },
    [timepoints]
  );

  const handleListWidthChange = useCallback(
    (listWidth: number, currentSectionRange: MiniMapSection) => {
      const timepointsDisplayCount = Math.floor(listWidth / (timepointWidth + TIMEPOINT_GAP_PX));
      handleTimepointDisplayCountChange(timepointsDisplayCount, currentSectionRange);
      setListWidth(listWidth);
    },
    [timepointWidth, handleTimepointDisplayCountChange]
  );

  const handleTimepointWidthChange = useCallback(
    (timepointWidth: number, currentSectionRange: MiniMapSection) => {
      const timepointsDisplayCount = Math.floor(listWidth / (timepointWidth + TIMEPOINT_GAP_PX));
      handleTimepointDisplayCountChange(timepointsDisplayCount, currentSectionRange);
      setTimepointWidth(timepointWidth);
    },
    [listWidth, handleTimepointDisplayCountChange]
  );

  const handleVizDisplayChange = useCallback((display: TimepointStatus, usedModifier: boolean) => {
    setVizDisplay((prev) => {
      const isSelected = prev.includes(display);
      const allSelected = prev.length === VIZ_DISPLAY_OPTIONS.length;

      if (usedModifier) {
        return isSelected ? prev.filter((value) => value !== display) : [...prev, display];
      }

      if (isSelected && !allSelected) {
        return VIZ_DISPLAY_OPTIONS;
      }

      return [display];
    });
  }, []);

  const handleVizOptionChange = useCallback((display: TimepointStatus, color: string) => {
    setVizOptions((prev) => {
      return { ...prev, [display]: color };
    });
  }, []);

  const handleHoverStateChange = useCallback((state: HoveredState) => {
    setHoveredState(state);
  }, []);

  const handleRefetch = useCallback(() => {
    refetchEndingLogs();
    refetchCheckConfigs();
    refetchMaxProbeDuration();
  }, [refetchEndingLogs, refetchCheckConfigs, refetchMaxProbeDuration]);

  useIsListResultPending({
    check,
    currentAdjustedTime,
    handleRefetch,
    listLogsMap,
  });

  const isInitialised = useIsInitialised({
    check,
    isLoading,
    handleViewerStateChange,
    timepoints,
    currentAdjustedTime,
  });

  const value: TimepointExplorerContextType = useMemo(() => {
    return {
      check,
      checkConfigs,
      checkEvents,
      currentAdjustedTime,
      explorerTimeFrom,
      handleHoverStateChange,
      handleListWidthChange,
      handleMiniMapPageChange,
      handleMiniMapSectionChange,
      handleRefetch,
      handleTimepointWidthChange,
      handleViewerStateChange,
      handleViewModeChange,
      handleVizDisplayChange,
      handleVizOptionChange,
      hoveredState,
      isError,
      isFetching,
      isInitialised,
      isLoading,
      isLogsRetentionPeriodWithinTimerange,
      listLogsMap,
      listWidth,
      miniMapCurrentPage,
      miniMapCurrentPageSections,
      miniMapCurrentSectionIndex,
      miniMapPages,
      timepoints,
      timepointsDisplayCount,
      timepointWidth,
      viewerState,
      viewMode,
      vizDisplay,
      vizOptions,
      yAxisMax,
    };
  }, [
    check,
    checkConfigs,
    checkEvents,
    currentAdjustedTime,
    explorerTimeFrom,
    handleHoverStateChange,
    handleListWidthChange,
    handleMiniMapPageChange,
    handleMiniMapSectionChange,
    handleRefetch,
    handleTimepointWidthChange,
    handleViewerStateChange,
    handleViewModeChange,
    handleVizDisplayChange,
    handleVizOptionChange,
    hoveredState,
    isError,
    isFetching,
    isInitialised,
    isLoading,
    isLogsRetentionPeriodWithinTimerange,
    listLogsMap,
    listWidth,
    miniMapCurrentPage,
    miniMapCurrentPageSections,
    miniMapCurrentSectionIndex,
    miniMapPages,
    timepoints,
    timepointsDisplayCount,
    timepointWidth,
    viewerState,
    viewMode,
    vizDisplay,
    vizOptions,
    yAxisMax,
  ]);

  return <TimepointExplorerContext.Provider value={value}>{children}</TimepointExplorerContext.Provider>;
};

export function useTimepointExplorerContext() {
  const context = useContext(TimepointExplorerContext);

  if (!context) {
    throw new Error('useTimepointExplorerContext must be used within a TimepointExplorerProvider');
  }

  return context;
}
