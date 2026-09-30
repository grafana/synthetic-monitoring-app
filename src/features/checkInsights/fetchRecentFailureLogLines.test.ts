import { http, HttpResponse } from 'msw';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { server } from 'test/server';

import { fetchRecentFailureLogLines } from './fetchRecentFailureLogLines';

const LOGS_URL = 'http://sm-logs-datasource';

function mockLokiResponse(lines: string[]) {
  server.use(
    http.get(`${LOGS_URL}/loki/api/v1/query_range`, () =>
      HttpResponse.json({
        data: {
          result: [
            {
              stream: {},
              // Ascending timestamps; fetchRecentFailureLogLines sorts most-recent-first itself.
              // Built via BigInt, not Number arithmetic — these are 19-digit nanosecond epoch
              // values, past Number's safe integer range, so `+ index` would round away the
              // very difference the sort needs to see.
              values: lines.map((line, index) => [String(BigInt('1700000000000000000') + BigInt(index)), line]),
            },
          ],
        },
      })
    )
  );
}

it('returns nothing when there is no logs datasource', async () => {
  const result = await fetchRecentFailureLogLines('', BASIC_HTTP_CHECK, 0, 1);

  expect(result).toEqual([]);
});

it('drops passing assertions and summarizes failing ones, most recent first', async () => {
  mockLokiResponse([
    'target=https://http.com probe=Frankfurt msg="check result" check="Click element" value="1"',
    'target=https://http.com probe=Frankfurt msg="check result" check="Click element" value="0"',
    'target=https://http.com probe=Frankfurt level=error msg="x509: certificate signed by unknown authority"',
  ]);

  const result = await fetchRecentFailureLogLines(LOGS_URL, BASIC_HTTP_CHECK, 0, 1);

  expect(result).toEqual([
    { text: 'error: x509: certificate signed by unknown authority', severity: 'critical' },
    { text: 'Failed assertion: "Click element"', severity: 'context' },
  ]);
});

it('treats level=info lines as context, not critical, even though they carry a msg', async () => {
  mockLokiResponse([
    'level=info msg="Beginning check"',
    'level=info msg="Check will be run with resolved k6 version"',
    'level=error msg="Uncaught (in promise) waiting for navigation: timed out after 10s"',
  ]);

  const result = await fetchRecentFailureLogLines(LOGS_URL, BASIC_HTTP_CHECK, 0, 1);

  expect(result).toEqual([
    { text: 'error: Uncaught (in promise) waiting for navigation: timed out after 10s', severity: 'critical' },
    { text: 'info: Check will be run with resolved k6 version', severity: 'context' },
    { text: 'info: Beginning check', severity: 'context' },
  ]);
});

it('deduplicates the same failure reason repeated across executions', async () => {
  mockLokiResponse([
    'msg="check result" check="Click element" value="0"',
    'msg="check result" check="Click element" value="0"',
  ]);

  const result = await fetchRecentFailureLogLines(LOGS_URL, BASIC_HTTP_CHECK, 0, 1);

  expect(result).toEqual([{ text: 'Failed assertion: "Click element"', severity: 'context' }]);
});

it('falls back to a raw, truncated line when nothing recognizable is found', async () => {
  mockLokiResponse(['some unstructured line with no fields']);

  const result = await fetchRecentFailureLogLines(LOGS_URL, BASIC_HTTP_CHECK, 0, 1);

  expect(result).toEqual([{ text: 'some unstructured line with no fields', severity: 'context' }]);
});

it('returns an empty list when the request fails', async () => {
  server.use(http.get(`${LOGS_URL}/loki/api/v1/query_range`, () => HttpResponse.error()));

  const result = await fetchRecentFailureLogLines(LOGS_URL, BASIC_HTTP_CHECK, 0, 1);

  expect(result).toEqual([]);
});
