import { CheckType } from 'types';

// Sometimes an error is logged with INFO level and sometimes there may be a need to upgrade a level from INFO to WARN
export const UPGRADED_LOG_MESSAGE: Array<string | [string, string] | [RegExp, string]> = [
  'Invalid HTTP response status code', // default log level is INFO, upgrade to ERROR
  'Failed to read HTTP response body',
  // 'Error for HTTP request',
  // 'Invalid HTTP version number',
  // 'Body did not match regular expression',
  ['Address does not match first address, not sending TLS ServerName', 'warn'],
  [/^Response received from https?:\/\/\S+, status \d{3}$/, 'info+'],
];

export const DEFAULT_TIMEOUT_IN_SECONDS = 30;
export const DEFAULT_GC_INTERVAL_IN_MILLISECONDS = 3000;

// Multi-line `msg` sometimes includes a "heading" kind of line, remove them
export const REDUNDANT_FIRST_LINES = [
  '', // Remove empty lines (no known use-case)
  'Response:', // k6 response logs
  'Request:', // k6 request logs
];

// Empty means All
export const ADHOC_CHECK_COMPATABILITY: CheckType[] = Object.values(CheckType).filter(
  (checkType) => checkType !== CheckType.Traceroute
);

export const INSUFFICIENT_LOG_ACCESS_MESSAGE =
  'To test checks, you need permission to read logs. You don’t currently have this permission';
