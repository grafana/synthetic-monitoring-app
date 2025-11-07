import { GrafanaTheme2 } from '@grafana/data';
import { IconName } from '@grafana/ui';

import { AdHocResult, LogEntry, ProbeStateStatus } from './types.adhoc-check';

import { UPGRADED_LOG_MESSAGE } from './constants';

function getTimeseriesMetric(name: string, timeseries: AdHocResult['line']['timeseries'] = []) {
  return timeseries.find((item) => item.name === name);
}

export function getProbeSuccess(state: ProbeStateStatus, timeseries?: AdHocResult['line']['timeseries']) {
  if (state !== ProbeStateStatus.Success) {
    return state;
  }

  const metric = getTimeseriesMetric('probe_success', timeseries);

  if (!metric) {
    return state;
  }

  const [gauge] = metric.metric;
  return gauge.gauge.value === 1 ? ProbeStateStatus.Success : ProbeStateStatus.Error;
}

export function getLogLevelFromMessage(message: string | undefined, defaultLevel = 'log') {
  for (const subject of UPGRADED_LOG_MESSAGE) {
    if (Array.isArray(subject)) {
      const [subjectMessage, level] = subject;
      if (subjectMessage instanceof RegExp && message && subjectMessage.test(message)) {
        return level;
      } else if (typeof subjectMessage === 'string' && message?.startsWith(subjectMessage)) {
        return level;
      }
    } else if (message?.startsWith(subject)) {
      return 'error';
    }
  }

  return defaultLevel.toLowerCase();
}

export function stringToLines(subject: string) {
  let lineBreak = '\n';
  if (subject.includes('\r\n')) {
    lineBreak = '\r\n';
  }

  return subject.split(lineBreak);
}

export function isMultiLineString(subject: string) {
  return subject.includes('\n') || subject.includes('\r');
}

export function getMsgFromLogMsg(msg: string) {
  if (isExpectLogLine(msg)) {
    return 'Test aborted';
  }

  if (isMultiLineString(msg)) {
    const [first, second] = stringToLines(msg);
    return [first, second].filter(Boolean).join('\n');
  }

  return msg;
}

export function getMsgIconFromLog(log: LogEntry): IconName | undefined {
  if ('source' in log && log.source === 'console') {
    return 'user';
  }

  if (log.level === 'error') {
    return 'exclamation-triangle';
  }

  return undefined;
}

export function isExpectLogLine(line: string) {
  return line.startsWith('test aborted:');
}

export function parseExpectLogLine(line: string) {
  const result: Record<string, string | number> = {};

  // Remove the "test aborted: " prefix if present
  const logLine = line.replace(/^test aborted:\s*/, '');

  // Regular expression to match key=value pairs
  const regex = /(\w+)=(?:"([^"]*)"|(\S+(?:\s+[^=\s]+)*?)(?=\s+\w+=|$))/g;
  let match;

  // Extract all key=value pairs except for the `line` field which needs special handling
  while ((match = regex.exec(logLine)) !== null) {
    const key = match[1];
    const quotedValue = match[2];
    const unquotedValue = match[3];

    if (key === 'line') {
      // For the 'line' field, we want everything after 'line=' until the end
      const lineStart = logLine.indexOf('line=') + 5;
      result[key] = logLine.substring(lineStart);
      break;
    } else {
      let value: string | number = quotedValue || unquotedValue;

      // Try to convert to number if it's a numeric string
      if (value && !isNaN(Number(value)) && !isNaN(parseFloat(value))) {
        result[key] = Number(value);
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

// append + to indicate user logging with console, or if info should be rendered like JS info
// Or just pass upgrade param
export function getLogColor(level: string, theme: GrafanaTheme2, upgrade = false) {
  const logLevel = upgrade ? level + '+' : level;
  switch (logLevel.toLowerCase()) {
    case 'warning+':
    case 'warning':
    case 'warn+':
    case 'warn':
      return theme.colors.warning.text;
    case 'error':
    case 'error+':
      return theme.colors.error.text;
    case 'info+': // means that it's an upgraded "info"
      return theme.colors.info.text;
    case 'debug+':
    case 'debug':
      return theme.colors.text.secondary;
    default:
      return theme.colors.text.primary;
  }
}
