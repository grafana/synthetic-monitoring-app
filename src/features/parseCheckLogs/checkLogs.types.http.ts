import { MSG_STRINGS_HTTP } from 'features/parseCheckLogs/checkLogs.constants.msgs';

import { ParsedCheckLog } from 'features/parseCheckLogs/checkLogs.types';

export type MakingHTTPRequestLog = ParsedCheckLog<{
  host: string;
  url: string;
  msg: (typeof MSG_STRINGS_HTTP)['MakingHTTPRequest'];
}>;

export type ReceivedHTTPResponseLog = ParsedCheckLog<{
  http_request: string;
  msg: (typeof MSG_STRINGS_HTTP)['ReceivedHTTPResponse'];
}>;
