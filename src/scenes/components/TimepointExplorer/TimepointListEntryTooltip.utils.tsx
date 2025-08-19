import { formatSmallDurations } from 'utils';
import {
  ProbeResults,
  SelectedState,
  StatefulTimepoint,
  TimepointStatus,
  UnixTimestamp,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getCouldBePending } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

export function getAverageDuration(probeResults: ProbeResults) {
  const executions = Object.values(probeResults).flat();

  if (executions.length === 0) {
    return '-';
  }

  return formatSmallDurations(
    executions.reduce((sum, execution) => {
      const duration = Number(execution.labels.duration_seconds) * 1000;
      return sum + duration;
    }, 0) / executions.length
  );
}

interface EntryToRender {
  status: TimepointStatus;
  probeName: string;
  duration: string;
  index: number;
}

interface GetEntriesToRenderProps {
  statefulTimepoint: StatefulTimepoint;
  selectedProbeNames: string[];
  currentAdjustedTime: UnixTimestamp;
  latestConfigDate: UnixTimestamp;
}

export function getEntriesToRender({
  statefulTimepoint,
  selectedProbeNames,
  currentAdjustedTime,
  latestConfigDate,
}: GetEntriesToRenderProps) {
  const { probeResults, config } = statefulTimepoint;
  const isCurrentConfig = config.from === latestConfigDate;

  return selectedProbeNames
    .map<EntryToRender[]>((probeName) => {
      const probeResultsForProbe = probeResults[probeName] || [];

      if (probeResultsForProbe.length) {
        return probeResultsForProbe.map((res, index) => {
          const { probe_success, duration_seconds } = res.labels;
          const status: TimepointStatus = probe_success === '1' ? 'success' : 'failure';

          return {
            status,
            probeName,
            duration: formatSmallDurations(Number(duration_seconds) * 1000),
            index,
          };
        });
      }

      const couldBePending = getCouldBePending(statefulTimepoint, currentAdjustedTime);
      const status: TimepointStatus = couldBePending ? 'pending' : 'missing';

      return [
        {
          status,
          probeName: probeName,
          duration: '-',
          index: 0,
        },
      ];
    })
    .flat()
    .filter((entry) => {
      if (isCurrentConfig) {
        return true;
      }

      return entry.status !== 'missing';
    });
}

export function matchState(current: SelectedState, matchState: SelectedState) {
  const [currentTimepoint, currentProbeName, currentExecutionIndex] = current;
  const [selectedTimepoint, selectedProbeName, selectedExecutionIndex] = matchState;

  return (
    currentTimepoint?.adjustedTime === selectedTimepoint?.adjustedTime &&
    currentProbeName === selectedProbeName &&
    currentExecutionIndex === selectedExecutionIndex
  );
}
