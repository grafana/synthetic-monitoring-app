import { ExecutionLogs } from 'features/parseCheckLogs/checkLogs.types';
import { Trace, TraceKeyValuePair, TraceProcess, TraceSpan } from 'scenes/components/LogsRenderer/TraceAndSpans.types';

export function checkToTrace(check: ExecutionLogs): Trace {
  if (check.length === 0) {
    throw new Error('CheckLogs array cannot be empty');
  }

  const startLog = check[0];
  const endLog = check[check.length - 1];

  // Extract basic trace information from the first log
  const traceID = startLog.id;
  const serviceName = startLog.labels.service_name;
  const checkName = startLog.labels.check_name;
  const region = startLog.labels.region;

  // Calculate trace timing (convert from nanoseconds to microseconds for Jaeger compatibility)
  const startTime = Math.floor(startLog.tsNs / 1000); // ns to μs
  const endTime = Math.floor(endLog.tsNs / 1000); // ns to μs
  const duration = endTime - startTime;

  // Create process information
  const processID = 'p1';
  const process: TraceProcess = {
    serviceName,
    tags: [
      { key: 'check_type', value: checkName },
      { key: 'region', value: region },
      { key: 'probe', value: startLog.labels.probe },
    ],
  };

  const spans: TraceSpan[] = [];

  // Create root span for the overall check execution
  const rootSpanID = `${traceID}-root`;
  const rootSpan: TraceSpan = {
    spanID: rootSpanID,
    traceID,
    processID,
    operationName: 'Check Execution',
    startTime,
    duration,
    logs: [
      {
        timestamp: startLog.Time,
        fields: [{ key: 'message', value: `${checkName} check execution` }],
      },
    ],
    tags: [
      { key: 'check_type', value: checkName },
      { key: 'region', value: region },
      { key: 'probe', value: startLog.labels.probe },
    ],
    references: [],
    warnings: [],
    flags: 1,
    childSpanIds: check.map((log) => log.id),
    depth: 0,
    hasChildren: true,
    childSpanCount: check.length,
    process,
    relativeStartTime: 0,
    subsidiarilyReferencedBy: [],
  };
  spans.push(rootSpan);

  // Create spans for each log entry
  check.forEach((log, index) => {
    const spanStartTime = Math.floor(log.tsNs / 1000); // ns to μs
    const spanDuration =
      index < check.length - 1
        ? Math.floor(check[index + 1].tsNs / 1000) - spanStartTime
        : Math.max(1000, endTime - spanStartTime); // Default 1ms or remaining time

    // Use the actual log message as the operation name
    const operationName = log.labels.msg || log.Line || `Log ${index + 1}`;

    // Create tags from log labels
    const tags: TraceKeyValuePair[] = Object.entries(log.labels)
      .filter(([key]) => !['msg', 'service_name'].includes(key))
      .map(([key, value]) => ({ key, value }));

    // Only create timing breakdown for actual "Response timings" logs
    const isResponseTimingLog = log.labels.msg?.includes('Response timings');
    const hasTimingData = isResponseTimingLog && hasResponseTimingFields(log.labels);

    const childSpanIds = hasTimingData ? [`${log.id}-timings`] : [];

    const logSpan: TraceSpan = {
      spanID: log.id,
      traceID,
      processID,
      operationName,
      startTime: spanStartTime,
      duration: Math.max(spanDuration, 0),
      logs: [
        {
          timestamp: log.Time,
          fields: [{ key: 'message', value: log.Line }],
        },
      ],
      tags,
      references: [{ traceID, spanID: rootSpanID }],
      warnings: [],
      flags: 1,
      childSpanIds,
      depth: 1,
      hasChildren: hasTimingData,
      childSpanCount: hasTimingData ? 1 : 0,
      process,
      relativeStartTime: spanStartTime - startTime,
      subsidiarilyReferencedBy: [],
    };
    spans.push(logSpan);

    // Create timing breakdown spans if this log has timing data
    if (hasTimingData) {
      const timingSpan = createTimingBreakdownSpan(log, traceID, processID, process, startTime);
      spans.push(timingSpan);
    }
  });

  // Build services summary
  const services = [
    {
      name: serviceName,
      numberOfSpans: spans.length,
    },
  ];

  const trace: Trace = {
    traceID,
    processes: { [processID]: process },
    warnings: [],
    duration,
    endTime,
    spans,
    startTime,
    traceName: `${serviceName}: ${checkName} check`,
    services,
  };

  return trace;
}

function hasResponseTimingFields(labels: Record<string, string>): boolean {
  // Check if the log contains response timing fields
  return !!(
    labels.connectDone ||
    labels.dnsDone ||
    labels.gotConn ||
    labels.responseStart ||
    labels.tlsDone ||
    labels.tlsStart ||
    labels.roundtrip
  );
}

function createTimingBreakdownSpan(
  log: any,
  traceID: string,
  processID: string,
  process: TraceProcess,
  baseStartTime: number
): TraceSpan {
  const spanStartTime = Math.floor(log.tsNs / 1000);
  const labels = log.labels;

  // Create child spans for different timing phases if the data is available
  const timingData = extractTimingData(labels);

  return {
    spanID: `${log.id}-timings`,
    traceID,
    processID,
    operationName: 'Timing Breakdown',
    startTime: spanStartTime,
    duration: timingData.totalDuration,
    logs: [
      {
        timestamp: log.Time,
        fields: [
          { key: 'message', value: 'HTTP response timing breakdown' },
          ...Object.entries(timingData.phases).map(([phase, duration]) => ({
            key: phase,
            value: `${duration}μs`,
          })),
        ],
      },
    ],
    tags: [
      { key: 'timing_type', value: 'response_breakdown' },
      ...Object.entries(timingData.phases).map(([phase, duration]) => ({
        key: `timing_${phase}`,
        value: duration.toString(),
      })),
    ],
    references: [{ traceID, spanID: log.id }],
    warnings: [],
    flags: 1,
    childSpanIds: [],
    depth: 2,
    hasChildren: false,
    childSpanCount: 0,
    process,
    relativeStartTime: spanStartTime - baseStartTime,
    subsidiarilyReferencedBy: [],
  };
}

function extractTimingData(labels: Record<string, string>) {
  // Extract timing information from labels if available
  const phases: Record<string, number> = {};
  let totalDuration = 0;

  if (labels.roundtrip) {
    totalDuration = parseFloat(labels.roundtrip) * 1000; // Convert to microseconds
  }

  // Extract individual phase timings if available
  if (labels.dnsDone && labels.start) {
    const dnsTime = new Date(labels.dnsDone).getTime() - new Date(labels.start).getTime();
    phases.dns = dnsTime * 1000; // Convert to microseconds
  }

  if (labels.gotConn && labels.dnsDone) {
    const connectTime = new Date(labels.gotConn).getTime() - new Date(labels.dnsDone).getTime();
    phases.connect = connectTime * 1000;
  }

  if (labels.tlsDone && labels.tlsStart) {
    const tlsTime = new Date(labels.tlsDone).getTime() - new Date(labels.tlsStart).getTime();
    phases.tls = tlsTime * 1000;
  }

  if (labels.responseStart && labels.gotConn) {
    const waitTime = new Date(labels.responseStart).getTime() - new Date(labels.gotConn).getTime();
    phases.wait = waitTime * 1000;
  }

  return {
    phases,
    totalDuration: totalDuration || 1000, // Default 1ms if no timing data
  };
}
