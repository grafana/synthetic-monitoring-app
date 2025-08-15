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
  MAX_PROBE_DURATION_DEFAULT,
  TIMEPOINT_EXPLORER_VIEW_OPTIONS,
  TIMEPOINT_GAP_PX,
  TIMEPOINT_SIZE,
  VIZ_DISPLAY_OPTIONS,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  useBuiltCheckConfigs,
  useExecutionEndingLogs,
  useIsResultPending,
  usePersistedMaxProbeDuration,
  useTimepoints,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import {
  CheckConfig,
  CheckEvent,
  MiniMapPages,
  MiniMapSection,
  MiniMapSections,
  SelectedState,
  StatefulTimepoint,
  StatelessTimepoint,
  TimepointStatus,
  UnixTimestamp,
  ViewMode,
  VizDisplay,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  constructCheckEvents,
  findNearest,
  getIsCheckCreationWithinTimerange,
  getMiniMapPages,
  getMiniMapSections,
  getVisibleTimepoints,
  getVisibleTimepointsTimeRange,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

interface TimepointExplorerContextType {
  check: Check;
  checkConfigs: CheckConfig[];
  checkEvents: CheckEvent[];
  handleHoverStateChange: (state: SelectedState) => void;
  handleListWidthChange: (listWidth: number, currentSectionRange: MiniMapSection) => void;
  handleMiniMapPageChange: (page: number) => void;
  handleMiniMapSectionChange: (sectionIndex: number) => void;
  handleSelectedStateChange: (state: SelectedState) => void;
  handleTimepointWidthChange: (timepointWidth: number, currentSectionRange: MiniMapSection) => void;
  handleViewModeChange: (viewMode: ViewMode) => void;
  handleVizDisplayChange: (display: TimepointStatus, usedModifier: boolean) => void;
  handleVizOptionChange: (display: TimepointStatus, color: string) => void;
  hoveredState: SelectedState;
  isCheckCreationWithinTimerange: boolean;
  isLogsRetentionPeriodWithinTimerange: boolean;
  isLoading: boolean;
  pendingResult: [StatelessTimepoint, string[]] | [];
  listWidth: number;
  logsMap: Record<UnixTimestamp, StatefulTimepoint>;
  maxProbeDuration: number;
  miniMapCurrentPage: number;
  miniMapCurrentPageSections: MiniMapSections;
  miniMapCurrentSectionIndex: number;
  miniMapPages: MiniMapPages;
  selectedState: SelectedState;
  timepointWidth: number;
  timepoints: StatelessTimepoint[];
  timepointsDisplayCount: number;
  viewMode: ViewMode;
  vizDisplay: VizDisplay;
  vizOptions: Record<TimepointStatus, string>;
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
  const logsRetentionTo = useMemo(() => Date.now() - logsRetentionPeriod, [logsRetentionPeriod, timeRange]);
  const [miniMapCurrentPage, setMiniMapPage] = useState(0);
  const [hoveredState, setHoveredState] = useState<SelectedState>([null, null, null]);
  const [selectedState, setSelectedState] = useState<SelectedState>([null, null, null]);
  const [miniMapCurrentSectionIndex, setMiniMapCurrentSectionIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>(TIMEPOINT_EXPLORER_VIEW_OPTIONS[0].value);
  const [timepointsDisplayCount, setTimepointsDisplayCount] = useState<number>(0);
  const theme = useTheme2();
  const [vizDisplay, setVizDisplay] = useState<VizDisplay>(VIZ_DISPLAY_OPTIONS);
  const [vizOptions, setVizOptions] = useState<Record<TimepointStatus, string>>({
    success: theme.visualization.getColorByName(`green`),
    failure: theme.visualization.getColorByName(`red`),
    missing: theme.visualization.getColorByName(`gray`),
    pending: theme.visualization.getColorByName(`blue`),
  });
  const [listWidth, setListWidth] = useState<number>(0);
  const [timepointWidth, setTimepointWidth] = useState<number>(TIMEPOINT_SIZE);
  const probeVar = useSceneVar('probe');

  const {
    data: maxProbeDurationData,
    isLoading: maxProbeDurationIsLoading,
    refetch: refetchMaxProbeDuration,
  } = usePersistedMaxProbeDuration({
    timeRange,
    check,
    probe: probeVar,
  });

  useEffect(() => {
    timeRangeRef.current = timeRange;
  }, [timeRange]);

  const maxProbeDuration =
    maxProbeDurationData < MAX_PROBE_DURATION_DEFAULT ? MAX_PROBE_DURATION_DEFAULT : maxProbeDurationData;

  const { checkConfigs, checkConfigsIsLoading, refetchCheckConfigs } = useBuiltCheckConfigs(check, logsRetentionTo);
  const timepoints = useTimepoints({ timeRange, checkConfigs, logsRetentionTo });
  const isLoading = maxProbeDurationIsLoading || checkConfigsIsLoading;
  const isCheckCreationWithinTimerange = getIsCheckCreationWithinTimerange(checkCreation, timepoints);
  const isLogsRetentionPeriodWithinTimerange = logsRetentionTo > timeRange.from.valueOf();

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

  const { logsMap, refetch: refetchEndingLogs } = useExecutionEndingLogs({
    timeRange: miniMapCurrentPageTimeRange,
    check,
    timepoints,
    probe: probeVar,
  });

  const checkEvents = useMemo(
    () =>
      constructCheckEvents({
        checkConfigs,
        checkCreation,
        logsRetentionTo,
      }),
    [checkConfigs, checkCreation, logsRetentionTo]
  );

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

  const handleSelectedStateChange = useCallback((state: SelectedState) => {
    const [timepoint, probeName, executionIndex] = state;

    setSelectedState(([prevTimepoint, prevProbeName, prevExecutionIndex]) => {
      return prevTimepoint?.adjustedTime === timepoint?.adjustedTime &&
        prevProbeName === probeName &&
        prevExecutionIndex === executionIndex
        ? [null, null, null]
        : state;
    });
  }, []);

  const handleTimepointDisplayCountChange = useCallback(
    (count: number, currentSectionRange: MiniMapSection) => {
      const newMiniMapPages = getMiniMapPages(timepoints.length, count, MAX_MINIMAP_SECTIONS);
      const nearestPage = findNearest(newMiniMapPages, currentSectionRange);
      const newMiniMapSections = getMiniMapSections(newMiniMapPages[nearestPage], count);
      const nearestSection = findNearest(newMiniMapSections, currentSectionRange);
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

  const handleHoverStateChange = useCallback((state: SelectedState) => {
    setHoveredState(state);
  }, []);

  const handleRefetch = useCallback(() => {
    refetchEndingLogs();
    refetchCheckConfigs();
    refetchMaxProbeDuration();
  }, [refetchEndingLogs, refetchCheckConfigs, refetchMaxProbeDuration]);

  const pendingResult = useIsResultPending({
    handleRefetch,
    check,
    logsMap,
    timepoints: visibleTimepoints,
  });

  const value: TimepointExplorerContextType = useMemo(() => {
    return {
      check,
      checkConfigs,
      checkEvents,
      handleListWidthChange,
      handleMiniMapPageChange,
      handleMiniMapSectionChange,
      handleSelectedStateChange,
      handleHoverStateChange,
      handleTimepointWidthChange,
      handleViewModeChange,
      handleVizDisplayChange,
      handleVizOptionChange,
      hoveredState,
      isCheckCreationWithinTimerange,
      isLoading,
      isLogsRetentionPeriodWithinTimerange,
      listWidth,
      logsMap,
      maxProbeDuration,
      miniMapCurrentPage,
      miniMapCurrentPageSections,
      miniMapCurrentSectionIndex,
      miniMapPages,
      pendingResult,
      selectedState,
      timepoints,
      timepointsDisplayCount,
      timepointWidth,
      viewMode,
      vizDisplay,
      vizOptions,
    };
  }, [
    check,
    checkConfigs,
    checkEvents,
    handleListWidthChange,
    handleMiniMapPageChange,
    handleMiniMapSectionChange,
    handleSelectedStateChange,
    handleHoverStateChange,
    handleTimepointWidthChange,
    handleViewModeChange,
    handleVizDisplayChange,
    handleVizOptionChange,
    hoveredState,
    isCheckCreationWithinTimerange,
    isLoading,
    isLogsRetentionPeriodWithinTimerange,
    listWidth,
    logsMap,
    maxProbeDuration,
    miniMapCurrentPage,
    miniMapCurrentPageSections,
    miniMapCurrentSectionIndex,
    miniMapPages,
    pendingResult,
    selectedState,
    timepoints,
    timepointsDisplayCount,
    timepointWidth,
    viewMode,
    vizDisplay,
    vizOptions,
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
