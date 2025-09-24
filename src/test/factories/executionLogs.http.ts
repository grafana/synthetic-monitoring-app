import { MSG_STRINGS_HTTP } from 'features/parseCheckLogs/checkLogs.constants.msgs';
import { Factory } from 'fishery';
import { buildExecutionLogFactory } from 'test/factories/executionLogs';
import { constructGoTimestamp } from 'test/utils';

import { HTTPResponseTimingsLabels, HTTPResponseTimingsLog } from 'features/parseCheckLogs/checkLogs.types.http';

const START_TIME = new Date().getTime();

const DEFAULT_RESPONSE_TIMINGS_LABELS: HTTPResponseTimingsLabels = {
  connectDone: constructGoTimestamp(START_TIME + 2000),
  dnsDone: constructGoTimestamp(START_TIME + 1000),
  end: constructGoTimestamp(START_TIME + 7000),
  gotConn: constructGoTimestamp(START_TIME + 5000),
  responseStart: constructGoTimestamp(START_TIME + 6000),
  msg: MSG_STRINGS_HTTP.ResponseTimings,
  roundtrip: '1',
  start: constructGoTimestamp(START_TIME + 0),
  time: constructGoTimestamp(START_TIME),
  tlsDone: constructGoTimestamp(START_TIME + 4000),
  tlsStart: constructGoTimestamp(START_TIME + 3000),
};

export const httpResponseTimingsLogFactory: Factory<HTTPResponseTimingsLog> =
  buildExecutionLogFactory<HTTPResponseTimingsLabels>(DEFAULT_RESPONSE_TIMINGS_LABELS);
