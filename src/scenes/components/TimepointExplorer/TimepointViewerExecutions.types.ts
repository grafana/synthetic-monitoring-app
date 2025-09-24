import { ExecutionLogs } from 'features/parseCheckLogs/checkLogs.types';
import { TimepointStatus } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export interface TabToRender {
  probeName: string;
  executions: ExecutionLogs[];
  status: TimepointStatus;
}
