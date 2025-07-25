import React, { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';
import { useTimeRange } from '@grafana/scenes-react';

import { Check } from 'types';
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
  MiniMapSections,
  SelectedTimepointState,
  StatefulTimepoint,
  StatelessTimepoint,
  UnixTimestamp,
  ViewMode,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  constructCheckEvents,
  generateAnnotations,
  getMiniMapPages,
  getMiniMapSections,
  getVisibleTimepoints,
  getVisibleTimepointsTimeRange,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

type TimepointExplorerContextType = {
  annotations: Annotation[];
  check: Check;
  checkConfigs: CheckConfig[];
  handleMiniMapPageChange: (page: number) => void;
  handleMiniMapSectionClick: (sectionIndex: number) => void;
  handleSelectedTimepointChange: (timepoint: StatelessTimepoint, probeToView: string) => void;
  handleViewModeChange: (viewMode: ViewMode) => void;
  handleWidthChange: (width: number) => void;
  isLoading: boolean;
  logsMap: Record<UnixTimestamp, StatefulTimepoint>;
  maxProbeDuration: number;
  miniMapCurrentPage: number;
  miniMapCurrentPageSections: MiniMapSections;
  miniMapCurrentPageTimeRange: { from: UnixTimestamp; to: UnixTimestamp };
  miniMapCurrentSectionIndex: number;
  miniMapPages: MiniMapPages;
  selectedTimepoint: SelectedTimepointState;
  timepoints: StatelessTimepoint[];
  timepointsDisplayCount: number;
  viewMode: ViewMode;
  width: number;
};

export const TimepointExplorerContext = createContext<TimepointExplorerContextType | null>(null);

interface TimepointExplorerProviderProps extends PropsWithChildren {
  check: Check;
}

export const TimepointExplorerProvider = ({ children, check }: TimepointExplorerProviderProps) => {
  const [timeRange] = useTimeRange();
  const [miniMapCurrentPage, setMiniMapPage] = useState(0);
  const [selectedTimepoint, setSelectedTimepoint] = useState<SelectedTimepointState>([null, null]);
  const [miniMapCurrentSectionIndex, setMiniMapCurrentSectionIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>(TIMEPOINT_EXPLORER_VIEW_OPTIONS[0].value);
  const [width, setWidth] = useState<number>(0);

  const { data: maxProbeDurationData, isLoading: maxProbeDurationIsLoading } = usePersistedMaxProbeDuration({
    timeRange,
    check,
  });

  const INITIAL_CHECK_CONFIG: CheckConfig = useMemo(() => {
    return {
      frequency: check.frequency,
      date: Number(check.created),
    };
  }, [check]);

  const maxProbeDuration =
    maxProbeDurationData < MAX_PROBE_DURATION_DEFAULT ? MAX_PROBE_DURATION_DEFAULT : maxProbeDurationData;
  const { data: checkConfigsData, isLoading: checkConfigsIsLoading } = usePersistedCheckConfigs({
    timeRange,
    check,
  });

  const checkConfigs = useMemo(() => {
    return checkConfigsData || [INITIAL_CHECK_CONFIG];
  }, [checkConfigsData, INITIAL_CHECK_CONFIG]);

  const timepoints = useTimepoints({ timeRange, checkConfigs });
  const isLoading = maxProbeDurationIsLoading || checkConfigsIsLoading;
  const timepointsDisplayCount = Math.floor(width / (TIMEPOINT_SIZE + TIMEPOINT_GAP_PX));

  const miniMapPages = useMemo(
    () => getMiniMapPages(timepoints, timepointsDisplayCount),
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
  const miniMapCurrentPageSections = useMemo(
    () => getMiniMapSections(miniMapPages[miniMapCurrentPage], timepointsDisplayCount),
    [miniMapPages, miniMapCurrentPage, timepointsDisplayCount]
  );

  const { logsMap } = useExecutionEndingLogs({
    timeRange: miniMapCurrentPageTimeRange,
    check,
    timepoints,
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

  const handleMiniMapPageChange = useCallback((page: number) => {
    setMiniMapPage(page);
  }, []);

  const handleViewModeChange = useCallback((viewMode: ViewMode) => {
    setViewMode(viewMode);
  }, []);

  const handleMiniMapSectionClick = useCallback((sectionIndex: number) => {
    setMiniMapCurrentSectionIndex(sectionIndex);
  }, []);

  const handleSelectedTimepointChange = useCallback((timepoint: StatelessTimepoint, probeToView: string) => {
    setSelectedTimepoint(([prevTimepoint, prevProbeToView]) => {
      return prevTimepoint?.adjustedTime === timepoint.adjustedTime && prevProbeToView === probeToView
        ? [null, null]
        : [timepoint, probeToView];
    });
  }, []);

  const handleWidthChange = useCallback((width: number) => {
    setWidth(width);
  }, []);

  const value: TimepointExplorerContextType = useMemo(() => {
    return {
      annotations,
      check,
      checkConfigs,
      handleMiniMapPageChange,
      handleMiniMapSectionClick,
      handleSelectedTimepointChange,
      handleViewModeChange,
      handleWidthChange,
      isLoading,
      logsMap,
      maxProbeDuration,
      miniMapCurrentPage,
      miniMapCurrentPageSections,
      miniMapCurrentPageTimeRange,
      miniMapCurrentSectionIndex,
      miniMapPages,
      selectedTimepoint,
      timepoints,
      timepointsDisplayCount,
      viewMode,
      width,
    };
  }, [
    annotations,
    check,
    checkConfigs,
    handleMiniMapPageChange,
    handleMiniMapSectionClick,
    handleSelectedTimepointChange,
    handleViewModeChange,
    handleWidthChange,
    isLoading,
    logsMap,
    maxProbeDuration,
    miniMapCurrentPage,
    miniMapCurrentPageSections,
    miniMapCurrentPageTimeRange,
    miniMapCurrentSectionIndex,
    miniMapPages,
    selectedTimepoint,
    timepoints,
    timepointsDisplayCount,
    viewMode,
    width,
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
