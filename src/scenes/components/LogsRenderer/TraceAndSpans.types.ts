export type Trace = TraceData & {
  duration: number;
  endTime: number;
  spans: TraceSpan[];
  startTime: number;
  traceName: string;
  services: Array<{ name: string; numberOfSpans: number }>;
};

export type TraceData = {
  processes: Record<string, TraceProcess>;
  traceID: string;
  warnings?: string[] | null;
};

export type TraceProcess = {
  serviceName: string;
  tags: TraceKeyValuePair[];
};

/**
 * Type representing a tag in a trace span or fields of a log.
 */
export type TraceKeyValuePair<T = any> = {
  key: string;
  value: T;
  type?: string;
};

export type TraceSpan = TraceSpanData & {
  depth: number;
  hasChildren: boolean;
  childSpanCount: number;
  process: TraceProcess;
  relativeStartTime: number;
  tags: NonNullable<TraceSpanData['tags']>;
  references: NonNullable<TraceSpanData['references']>;
  warnings: NonNullable<TraceSpanData['warnings']>;
  childSpanIds: NonNullable<TraceSpanData['childSpanIds']>;
  subsidiarilyReferencedBy: TraceSpanReference[];
};

export type TraceSpanData = {
  spanID: string;
  traceID: string;
  processID: string;
  operationName: string;
  // Times are in microseconds
  startTime: number;
  duration: number;
  logs: TraceLog[];
  tags?: TraceKeyValuePair[];
  kind?: string;
  statusCode?: number;
  statusMessage?: string;
  instrumentationLibraryName?: string;
  instrumentationLibraryVersion?: string;
  traceState?: string;
  references?: TraceSpanReference[];
  warnings?: string[] | null;
  stackTraces?: string[];
  flags: number;
  errorIconColor?: string;
  dataFrameRowIndex?: number;
  childSpanIds?: string[];
};

/**
 * Type representing a log in a span.
 */
export type TraceLog = {
  // Millisecond epoch time
  timestamp: number;
  fields: TraceKeyValuePair[];
  name?: string;
};

export type TraceSpanReference = {
  traceID: string;
  spanID: string;
  tags?: TraceKeyValuePair[];
};
