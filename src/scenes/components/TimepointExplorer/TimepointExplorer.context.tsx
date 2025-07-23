import React, { createContext, PropsWithChildren, RefObject, useContext, useEffect, useMemo, useState } from 'react';
import { useTimeRange } from '@grafana/scenes-react';

import { Check } from 'types';
import {
  MAX_PROBE_DURATION_DEFAULT,
  TIMEPOINT_GAP_PX,
  TIMEPOINT_SIZE,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  useExplorerWidth,
  usePersistedCheckConfigs,
  usePersistedMaxProbeDuration,
  useTimepoints,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { CheckConfig, Timepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getMiniMapPages } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

type TimepointExplorerContextType = {
  check: Check;
  checkConfigs: CheckConfig[];
  isLoading: boolean;
  handleMiniMapPageChange: React.Dispatch<React.SetStateAction<number>>;
  maxProbeDuration: number;
  miniMapPage: number;
  miniMapPages: Array<[number, number]>;
  miniMapVisibleTimepoints: Timepoint[];
  timepointsDisplayCount: number;
  width: number;
  ref: RefObject<HTMLDivElement | null>;
} | null;

export const TimepointExplorerContext = createContext<TimepointExplorerContextType>(null);

interface TimepointExplorerProviderProps extends PropsWithChildren {
  check: Check;
}

export const TimepointExplorerProvider = ({ children, check }: TimepointExplorerProviderProps) => {
  const [timeRange] = useTimeRange();
  const [miniMapPage, setMiniMapPage] = useState(0);

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

  // reset miniMapPage to 0 when miniMapPages changes (such as screen resize)
  useEffect(() => {
    if (miniMapPages.length > 0) {
      setMiniMapPage(0);
    }
  }, [miniMapPages]);

  const [miniMapStartingIndex, miniMapEndingIndex] = miniMapPages[miniMapPage] || [0, 0];
  const miniMapVisibleTimepoints = timepoints.slice(miniMapStartingIndex, miniMapEndingIndex);

  return (
    <TimepointExplorerContext.Provider
      value={{
        check,
        checkConfigs,
        isLoading,
        handleMiniMapPageChange: setMiniMapPage,
        maxProbeDuration,
        miniMapPage,
        miniMapPages,
        miniMapVisibleTimepoints,
        timepointsDisplayCount,
        width,
        ref,
      }}
    >
      {children}
    </TimepointExplorerContext.Provider>
  );
};

export function useTimepointExplorerContext() {
  const context = useContext(TimepointExplorerContext);

  if (!context) {
    throw new Error('useTimepointExplorerContext must be used within a TimepointExplorerProvider');
  }

  return context;
}
