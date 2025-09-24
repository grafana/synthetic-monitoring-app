import { MSG_STRINGS_HTTP } from 'features/parseCheckLogs/checkLogs.constants.msgs';

import { UnknownExecutionLog } from 'features/parseCheckLogs/checkLogs.types';

export type ResolvingTargetAddressLabels = {
  ip_protocol: `ip4` | `ip6`;
  msg: (typeof MSG_STRINGS_HTTP)['ResolvingTarget'];
};

export type ResolvedTargetAddressLabels = {
  ip: string;
  msg: (typeof MSG_STRINGS_HTTP)['ResolvedTarget'];
};

export type MakingHTTPRequestLabels = {
  host: string;
  url: string;
  msg: (typeof MSG_STRINGS_HTTP)['MakingHTTPRequest'];
};

export type ReceivedHTTPResponseLabels = {
  http_request: string;
  msg: (typeof MSG_STRINGS_HTTP)['ReceivedHTTPResponse'];
};

export type HTTPResponseTimingsLabels = {
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
};

export type ResolvingTargetAddressLog = UnknownExecutionLog<ResolvingTargetAddressLabels>;
export type ResolvedTargetAddressLog = UnknownExecutionLog<ResolvedTargetAddressLabels>;
export type MakingHTTPRequestLog = UnknownExecutionLog<MakingHTTPRequestLabels>;
export type ReceivedHTTPResponseLog = UnknownExecutionLog<ReceivedHTTPResponseLabels>;
export type HTTPResponseTimingsLog = UnknownExecutionLog<HTTPResponseTimingsLabels>;
