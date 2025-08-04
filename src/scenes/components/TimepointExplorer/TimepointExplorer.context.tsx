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
import { useProbes } from 'data/useProbes';
import { useSceneVar } from 'scenes/Common/useSceneVar';
import {
  MAX_PROBE_DURATION_DEFAULT,
  TIMEPOINT_EXPLORER_VIEW_OPTIONS,
  TIMEPOINT_GAP_PX,
  TIMEPOINT_SIZE,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  useExecutionEndingLogs,
  usePersistedCheckConfigs,
  usePersistedMaxProbeDuration,
  useTimepoints,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import {
  Annotation,
  CheckConfig,
  MiniMapPages,
  MiniMapSection,
  MiniMapSections,
  SelectedTimepointState,
  StatefulTimepoint,
  StatelessTimepoint,
  UnixTimestamp,
  ViewMode,
  VizDisplay,
  VizDisplayValue,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  constructCheckEvents,
  findNearest,
  generateAnnotations,
  getIsResultPending,
  getMiniMapPages,
  getMiniMapSections,
  getVisibleTimepoints,
  getVisibleTimepointsTimeRange,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

type TimepointExplorerContextType = {
  annotations: Annotation[];
  check: Check;
  checkConfigs: CheckConfig[];
  handleExecutionHover: (executionId: string | null) => void;
  handleListWidthChange: (listWidth: number, currentSectionRange: MiniMapSection) => void;
  handleMiniMapPageChange: (page: number) => void;
  handleMiniMapSectionChange: (sectionIndex: number) => void;
  handleSelectedTimepointChange: (timepoint: StatelessTimepoint, executionToView: string) => void;
  handleTimepointWidthChange: (timepointWidth: number, currentSectionRange: MiniMapSection) => void;
  handleViewModeChange: (viewMode: ViewMode) => void;
  handleVizDisplayChange: (display: VizDisplayValue, usedModifier: boolean) => void;
  handleVizOptionChange: (display: VizDisplayValue, color: string) => void;
  hoveredExecution: string | null;
  isLoading: boolean;
  isResultPending: boolean;
  listWidth: number;
  logsMap: Record<UnixTimestamp, StatefulTimepoint>;
  maxProbeDuration: number;
  miniMapCurrentPage: number;
  miniMapCurrentPageSections: MiniMapSections;
  miniMapCurrentPageTimeRange: { from: UnixTimestamp; to: UnixTimestamp };
  miniMapCurrentSectionIndex: number;
  miniMapPages: MiniMapPages;
  selectedTimepoint: SelectedTimepointState;
  timepointWidth: number;
  timepoints: StatelessTimepoint[];
  timepointsDisplayCount: number;
  viewMode: ViewMode;
  vizDisplay: VizDisplay;
  vizOptions: Record<VizDisplayValue, string>;
};

export const TimepointExplorerContext = createContext<TimepointExplorerContextType | null>(null);

interface TimepointExplorerProviderProps extends PropsWithChildren {
  check: Check;
}

export const TimepointExplorerProvider = ({ children, check }: TimepointExplorerProviderProps) => {
  const [timeRange] = useTimeRange();
  const timeRangeRef = useRef<TimeRange>(timeRange);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [miniMapCurrentPage, setMiniMapPage] = useState(0);
  const [selectedTimepoint, setSelectedTimepoint] = useState<SelectedTimepointState>([null, null]);
  const [miniMapCurrentSectionIndex, setMiniMapCurrentSectionIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>(TIMEPOINT_EXPLORER_VIEW_OPTIONS[0].value);
  const [timepointsDisplayCount, setTimepointsDisplayCount] = useState<number>(0);
  const theme = useTheme2();
  const [vizDisplay, setVizDisplay] = useState<VizDisplay>([`success`, `failure`, `unknown`]);
  const [vizOptions, setVizOptions] = useState<Record<VizDisplayValue, string>>({
    success: theme.visualization.getColorByName(`green`),
    failure: theme.visualization.getColorByName(`red`),
    unknown: theme.visualization.getColorByName(`gray`),
  });
  const [listWidth, setListWidth] = useState<number>(0);
  const [timepointWidth, setTimepointWidth] = useState<number>(TIMEPOINT_SIZE);
  const [hoveredExecution, setHoveredExecution] = useState<string | null>(null);
  const probeVar = useSceneVar('probe');
  const { data: probes = [] } = useProbes();

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

  const INITIAL_CHECK_CONFIG: CheckConfig = useMemo(() => {
    return {
      frequency: check.frequency,
      date: Number(check.created),
    };
  }, [check]);

  const maxProbeDuration =
    maxProbeDurationData < MAX_PROBE_DURATION_DEFAULT ? MAX_PROBE_DURATION_DEFAULT : maxProbeDurationData;
  const {
    data: checkConfigsData,
    isLoading: checkConfigsIsLoading,
    refetch: refetchCheckConfigs,
  } = usePersistedCheckConfigs({
    timeRange,
    check,
    probe: probeVar,
  });

  const checkConfigs = useMemo(() => {
    return checkConfigsData || [INITIAL_CHECK_CONFIG];
  }, [checkConfigsData, INITIAL_CHECK_CONFIG]);

  const timepoints = useTimepoints({ timeRange, checkConfigs });
  const isLoading = maxProbeDurationIsLoading || checkConfigsIsLoading;

  const miniMapPages = useMemo(
    () => getMiniMapPages(timepoints.length, timepointsDisplayCount),
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
        timeRangeFrom: miniMapCurrentPageTimeRange.from,
        checkConfigs,
        checkCreation: check.created,
      }),
    [miniMapCurrentPageTimeRange.from, checkConfigs, check.created]
  );

  const annotations = useMemo(
    () => generateAnnotations({ checkEvents, timepoints: visibleTimepoints }),
    [checkEvents, visibleTimepoints]
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

  const handleSelectedTimepointChange = useCallback((timepoint: StatelessTimepoint, executionToView: string) => {
    setSelectedTimepoint(([prevTimepoint, prevExecutionToView]) => {
      return prevTimepoint?.adjustedTime === timepoint.adjustedTime && prevExecutionToView === executionToView
        ? [null, null]
        : [timepoint, executionToView];
    });
  }, []);

  const handleTimepointDisplayCountChange = useCallback(
    (count: number, currentSectionRange: MiniMapSection) => {
      const newMiniMapPages = getMiniMapPages(timepoints.length, count);
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

  const handleVizDisplayChange = useCallback((display: VizDisplayValue, usedModifier: boolean) => {
    setVizDisplay((prev) => {
      const isSelected = prev.includes(display);
      const allSelected = prev.length === 3;

      if (usedModifier) {
        return isSelected ? prev.filter((value) => value !== display) : [...prev, display];
      }

      if (isSelected && !allSelected) {
        return [`success`, `failure`, `unknown`];
      }

      return [display];
    });
  }, []);

  const handleVizOptionChange = useCallback((display: VizDisplayValue, color: string) => {
    setVizOptions((prev) => {
      return { ...prev, [display]: color };
    });
  }, []);

  const handleExecutionHover = useCallback((executionId: string | null) => {
    setHoveredExecution(executionId);
  }, []);

  const isResultPending = getIsResultPending({ check, logsMap, selectedProbes: probeVar, timepoints, probes });

  useEffect(() => {
    if (isResultPending && !intervalRef.current) {
      console.log(`setting interval`);

      intervalRef.current = setInterval(() => {
        console.log(`refetching`);
        refetchEndingLogs();
        refetchCheckConfigs();
        refetchMaxProbeDuration();
      }, 3000);
    }

    if (!isResultPending) {
      if (intervalRef.current) {
        console.log(`clearing`);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        console.log(`clearing - unmount`);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isResultPending, refetchEndingLogs, refetchCheckConfigs, refetchMaxProbeDuration]);

  const value: TimepointExplorerContextType = useMemo(() => {
    return {
      annotations,
      check,
      checkConfigs,
      handleExecutionHover,
      handleListWidthChange,
      handleMiniMapPageChange,
      handleMiniMapSectionChange,
      handleSelectedTimepointChange,
      handleTimepointWidthChange,
      handleViewModeChange,
      handleVizDisplayChange,
      handleVizOptionChange,
      hoveredExecution,
      isLoading,
      isResultPending,
      listWidth,
      logsMap,
      maxProbeDuration,
      miniMapCurrentPage,
      miniMapCurrentPageSections,
      miniMapCurrentPageTimeRange,
      miniMapCurrentSectionIndex,
      miniMapPages,
      selectedTimepoint,
      timepointWidth,
      timepoints,
      timepointsDisplayCount,
      viewMode,
      vizDisplay,
      vizOptions,
    };
  }, [
    annotations,
    check,
    checkConfigs,
    handleExecutionHover,
    handleListWidthChange,
    handleMiniMapPageChange,
    handleMiniMapSectionChange,
    handleSelectedTimepointChange,
    handleTimepointWidthChange,
    handleViewModeChange,
    handleVizDisplayChange,
    handleVizOptionChange,
    hoveredExecution,
    isLoading,
    isResultPending,
    listWidth,
    logsMap,
    maxProbeDuration,
    miniMapCurrentPage,
    miniMapCurrentPageSections,
    miniMapCurrentPageTimeRange,
    miniMapCurrentSectionIndex,
    miniMapPages,
    selectedTimepoint,
    timepointWidth,
    timepoints,
    timepointsDisplayCount,
    viewMode,
    vizDisplay,
    vizOptions,
  ]);

  if (!timepoints.length) {
    return null;
  }

  return <TimepointExplorerContext.Provider value={value}>{children}</TimepointExplorerContext.Provider>;
};

export function useTimepointExplorerContext() {
  const context = useContext(TimepointExplorerContext);

  if (!context) {
    throw new Error('useTimepointExplorerContext must be used within a TimepointExplorerProvider');
  }

  return context;
}
