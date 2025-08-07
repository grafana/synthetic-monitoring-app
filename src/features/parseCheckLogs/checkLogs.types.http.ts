import { MSG_STRINGS_HTTP } from 'features/parseCheckLogs/checkLogs.constants.msgs';

import { ParsedExecutionLog } from 'features/parseCheckLogs/checkLogs.types';

export type MakingHTTPRequestLog = ParsedExecutionLog<{
  host: string;
  url: string;
  msg: (typeof MSG_STRINGS_HTTP)['MakingHTTPRequest'];
}>;

export type ReceivedHTTPResponseLog = ParsedExecutionLog<{
  http_request: string;
  msg: (typeof MSG_STRINGS_HTTP)['ReceivedHTTPResponse'];
}>;

export type HTTPResponseTimings = ParsedExecutionLog<{
  connectDone: string; // date
  dnsDone: string; // date
  end: string; // date
  gotConn: string; // date
  msg: (typeof MSG_STRINGS_HTTP)['ResponseTimings'];
  responseStart: string; // date
  roundtrip: string; // number
  start: string; // date
  time: string; // date
  tlsDone: string; // date
  tlsStart: string; // date
}>;
