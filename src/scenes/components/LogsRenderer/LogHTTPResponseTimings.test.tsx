import React from 'react';
import { render, screen } from '@testing-library/react';
import { MSG_STRINGS_HTTP } from 'features/parseCheckLogs/checkLogs.constants.msgs';
import { httpResponseTimingsLogFactory } from 'test/factories/executionLogs.http';

import { HTTPResponseTimingsLabels } from 'features/parseCheckLogs/checkLogs.types.http';

import { LogHTTPResponseTimings } from './LogHTTPResponseTimings';

// example: 2024-06-20 02:40:00.86273212 +0000 UTC
function constructGoTimestamp(unixTimestamp: number, nanoseconds = 0) {
  const date = new Date(unixTimestamp);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth()).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const HH = String(date.getUTCHours()).padStart(2, '0');
  const MM = String(date.getUTCMinutes()).padStart(2, '0');
  const SS = String(date.getUTCSeconds()).padStart(2, '0');

  const nanoStr = String(nanoseconds).padStart(8, '0').slice(0, 8);
  return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}.${nanoStr} +0000 UTC`;
}

describe('LogHTTPResponseTimings', () => {
  it('should render the different categories', () => {
    const START_TIME = new Date().getTime();

    const labels: HTTPResponseTimingsLabels = {
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

    const log = httpResponseTimingsLogFactory.build({ labels });

    render(<LogHTTPResponseTimings log={log} />);
    expect(screen.getByText(/Resolve: 1s/i)).toBeInTheDocument();
    expect(screen.getByText(/Connect: 1s/i)).toBeInTheDocument();
    expect(screen.getByText(/TLS: 1s/i)).toBeInTheDocument();
    expect(screen.getByText(/Processing: 1s/i)).toBeInTheDocument();
    expect(screen.getByText(/Transfer: 1s/i)).toBeInTheDocument();
    expect(screen.getByText(/Total: 5s/i)).toBeInTheDocument();
  });

  it('should render request aborted if the total time is 0', () => {
    const ABORTED_STRING = `0001-01-01T00:00:00Z`;

    const labels: HTTPResponseTimingsLabels = {
      connectDone: ABORTED_STRING,
      dnsDone: ABORTED_STRING,
      end: ABORTED_STRING,
      gotConn: ABORTED_STRING,
      responseStart: ABORTED_STRING,
      msg: MSG_STRINGS_HTTP.ResponseTimings,
      roundtrip: '1',
      start: ABORTED_STRING,
      time: ABORTED_STRING,
      tlsDone: ABORTED_STRING,
      tlsStart: ABORTED_STRING,
    };

    const log = httpResponseTimingsLogFactory.build({ labels });

    render(<LogHTTPResponseTimings log={log} />);
    expect(screen.getByText(/Request was aborted/i)).toBeInTheDocument();
  });
});
