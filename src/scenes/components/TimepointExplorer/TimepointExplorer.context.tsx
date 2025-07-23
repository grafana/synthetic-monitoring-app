import React, { createContext, PropsWithChildren, RefObject, useContext, useEffect, useMemo, useState } from 'react';
import { useTimeRange } from '@grafana/scenes-react';

import { CheckLabels, CheckLabelType, EndingLogLabels } from 'features/parseCheckLogs/checkLogs.types';
import { ParsedLokiRecord } from 'features/parseLogs/parseLogs.types';
import { Check } from 'types';
import {
  MAX_PROBE_DURATION_DEFAULT,
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
import { CheckConfig, StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getMiniMapPages } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

type TimepointExplorerContextType = {
  check: Check;
  checkConfigs: CheckConfig[];
  isLoading: boolean;
  handleMiniMapPageChange: React.Dispatch<React.SetStateAction<number>>;
  logsData: Array<ParsedLokiRecord<CheckLabels & EndingLogLabels, CheckLabelType>>;
  maxProbeDuration: number;
  miniMapPage: number;
  miniMapPages: Array<[number, number]>;
  timepoints: StatelessTimepoint[];
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
  const timepointTo = timepoints[timepoints.length - 1];
  const timepointFrom = timepoints[0];
  const timeRangeTo = timepointTo?.adjustedTime + timepointTo?.timepointDuration;
  const timeRangeFrom = timepointFrom?.adjustedTime;

  const miniMapPageTimeRange = useMemo(() => {
    return {
      from: timeRangeFrom,
      to: timeRangeTo,
    };
  }, [timeRangeFrom, timeRangeTo]);

  const { data: logsData = [] } = useExecutionEndingLogs({ timeRange: miniMapPageTimeRange, check });

  // reset miniMapPage to 0 when miniMapPages changes (such as screen resize)
  // todo make this better
  useEffect(() => {
    if (miniMapPages.length > 0) {
      setMiniMapPage(0);
    }
  }, [miniMapPages]);

  return (
    <TimepointExplorerContext.Provider
      value={{
        check,
        checkConfigs,
        isLoading,
        handleMiniMapPageChange: setMiniMapPage,
        logsData,
        maxProbeDuration,
        miniMapPage,
        miniMapPages,
        timepoints,
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
