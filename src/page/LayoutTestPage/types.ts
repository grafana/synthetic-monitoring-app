import { DataFrameJSON } from '@grafana/data';

export interface LokiQueryResults<RefId extends keyof any = 'A'> {
  results: Record<
    RefId,
    {
      frames: DataFrameJSON[];
      status: number;
    }
  >;
}

export interface UseLogsQueryArgs {
  expr: string;
  from: string | number;
  to?: string | number;
}
