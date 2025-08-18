import { formatSmallDurations } from 'utils';
import {
  ProbeResults,
  SelectedState,
  StatefulTimepoint,
  TimepointStatus,
  UnixTimestamp,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

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
}

export function getEntriesToRender(
  statefulTimepoint: StatefulTimepoint,
  selectedProbeNames: string[],
  currentAdjustedTime: UnixTimestamp
): EntryToRender[] {
  const { probeResults } = statefulTimepoint;

  return selectedProbeNames
    .map((probeName) => {
      const probeResultsForProbe = probeResults[probeName] || [];

      if (probeResultsForProbe.length) {
        return probeResultsForProbe.map((res) => {
          const { probe_success, duration_seconds } = res.labels;
          const status: TimepointStatus = probe_success === '1' ? 'success' : 'failure';

          return {
            status,
            probeName,
            duration: formatSmallDurations(Number(duration_seconds) * 1000),
          };
        });
      }

      const couldBePending = [
        statefulTimepoint.adjustedTime,
        statefulTimepoint.adjustedTime + statefulTimepoint.timepointDuration,
      ].includes(currentAdjustedTime);
      const status: TimepointStatus = couldBePending ? 'pending' : 'missing';

      return [
        {
          status,
          probeName: probeName,
          duration: '-',
        },
      ];
    })
    .flat();
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
