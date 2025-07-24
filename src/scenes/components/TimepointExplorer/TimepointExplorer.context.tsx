import React, {
  createContext,
  PropsWithChildren,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTimeRange } from '@grafana/scenes-react';

import { CheckLabels, CheckLabelType, EndingLogLabels } from 'features/parseCheckLogs/checkLogs.types';
import { ParsedLokiRecord } from 'features/parseLogs/parseLogs.types';
import { Check } from 'types';
import {
  MAX_PROBE_DURATION_DEFAULT,
  TIMEPOINT_EXPLORER_VIEW_OPTIONS,
  TIMEPOINT_GAP_PX,
  TIMEPOINT_SIZE,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  useExecutionEndingLogs,
  useExplorerWidth,
  usePersistedCheckConfigs,
  usePersistedMaxProbeDuration,
  useTimepoints,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import {
  Annotation,
  CheckConfig,
  MinimapSection,
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
  isLoading: boolean;
  logsData: Array<ParsedLokiRecord<CheckLabels & EndingLogLabels, CheckLabelType>>;
  logsMap: Record<UnixTimestamp, StatefulTimepoint>;
  maxProbeDuration: number;
  miniMapCurrentPage: number;
  miniMapCurrentPageSections: MinimapSection[];
  miniMapCurrentPageTimeRange: { from: UnixTimestamp; to: UnixTimestamp };
  miniMapCurrentSectionIndex: number;
  miniMapPages: Array<[number, number]>;
  ref: RefObject<HTMLDivElement | null>;
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

  const { data: maxProbeDurationData, isLoading: maxProbeDurationIsLoading } = usePersistedMaxProbeDuration({
    timeRange,
    check,
  });

  const INITIAL_CHECK_CONFIG: CheckConfig = {
    frequency: check.frequency,
    date: Number(check.created),
  };

  const maxProbeDuration =
    maxProbeDurationData < MAX_PROBE_DURATION_DEFAULT ? MAX_PROBE_DURATION_DEFAULT : maxProbeDurationData;
  const { data: checkConfigs = [INITIAL_CHECK_CONFIG], isLoading: checkConfigsIsLoading } = usePersistedCheckConfigs({
    timeRange,
    check,
  });
  const timepoints = useTimepoints({ timeRange, checkConfigs });
  const isLoading = maxProbeDurationIsLoading || checkConfigsIsLoading;
  const { width, ref } = useExplorerWidth();
  const timepointsDisplayCount = Math.floor(width / (TIMEPOINT_SIZE + TIMEPOINT_GAP_PX));

  const miniMapPages = useMemo(
    () => getMiniMapPages(timepoints, timepointsDisplayCount),
    [timepoints, timepointsDisplayCount]
  );

  const visibleTimepoints = getVisibleTimepoints({ timepoints, miniMapCurrentPage, miniMapPages });
  const miniMapCurrentPageTimeRange = getVisibleTimepointsTimeRange({ timepoints: visibleTimepoints });
  const miniMapCurrentPageSections = getMiniMapSections(visibleTimepoints, timepointsDisplayCount);

  const { data: logsData = [], logsMap } = useExecutionEndingLogs({
    timeRange: miniMapCurrentPageTimeRange,
    check,
    timepoints,
  });

  const checkEvents = constructCheckEvents({
    timeRangeFrom: miniMapCurrentPageTimeRange.from,
    checkConfigs,
    checkCreation: check.created,
  });

  const annotations = generateAnnotations({ checkEvents, timepoints: visibleTimepoints });

  // reset miniMapPage to 0 when miniMapPages changes (such as screen resize)
  // todo make this better
  useEffect(() => {
    if (miniMapPages.length > 0) {
      setMiniMapPage(0);
    }
  }, [miniMapPages]);

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

  const value: TimepointExplorerContextType = useMemo(() => {
    return {
      annotations,
      check,
      checkConfigs,
      handleMiniMapPageChange,
      handleMiniMapSectionClick,
      handleSelectedTimepointChange,
      handleViewModeChange,
      isLoading,
      logsData,
      logsMap,
      maxProbeDuration,
      miniMapCurrentPage,
      miniMapCurrentPageSections,
      miniMapCurrentPageTimeRange,
      miniMapCurrentSectionIndex,
      miniMapPages,
      ref,
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
    isLoading,
    logsData,
    logsMap,
    maxProbeDuration,
    miniMapCurrentPage,
    miniMapCurrentPageSections,
    miniMapCurrentPageTimeRange,
    miniMapCurrentSectionIndex,
    miniMapPages,
    ref,
    selectedTimepoint,
    timepoints,
    timepointsDisplayCount,
    viewMode,
    width,
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
