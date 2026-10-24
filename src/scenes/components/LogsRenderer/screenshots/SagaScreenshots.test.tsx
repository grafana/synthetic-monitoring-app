import React, { useState } from 'react';
import { config } from '@grafana/runtime';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { sortLogs } from 'features/parseLokiLogs/parseLokiLogs';
import { unknownExecutionLogFactory } from 'test/factories/executionLogs';
import { SM_DATASOURCE } from 'test/fixtures/datasources';
import { SAGA_UUID, sagaMetadata, sagaQueryResponse, SECOND_SAGA_UUID } from 'test/fixtures/saga';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles } from 'test/utils';

import { LokiFieldNames } from 'features/parseLokiLogs/parseLokiLogs.types';
import { FeatureName } from 'types';
import { SMDataSource } from 'datasource/DataSource';

import { LogsEvent } from '../LogsEvent';
import { getScreenshotDatasource, INFINITY_DATASOURCE_TYPE } from './saga';

const TEST_UID = 'mock-saga-infinity';
const from = 1700000000000;
const to = 1700000060000;

function logs() {
  return [
    'Before capture',
    `screenshot:${SAGA_UUID}`,
    'Between captures',
    `screenshot:${SECOND_SAGA_UUID}`,
    'After capture',
  ].map((msg, index) =>
    unknownExecutionLogFactory.build({
      id: `row-${index}`,
      labels: { msg, detected_level: 'info' },
      [LokiFieldNames.TimeStamp]: from,
      nanos: index * 1000,
    })
  );
}

function renderLogs(entries = logs()) {
  return render(<LogsEvent logs={entries} mainKey="msg" from={from} to={to} />);
}

beforeEach(() => {
  mockFeatureToggles({ [FeatureName.Screenshots]: true });
  jest.replaceProperty(SM_DATASOURCE, 'jsonData', { ...SM_DATASOURCE.jsonData, screenshots: { uid: TEST_UID } });
  jest.replaceProperty(config, 'datasources', {
    ...config.datasources,
    Saga: { ...SM_DATASOURCE, uid: TEST_UID, type: INFINITY_DATASOURCE_TYPE },
  });
  jest.spyOn(SMDataSource.prototype, 'queryLogsV2');
  server.use(apiRoute('getSagaScreenshot'));
});

it('keeps captures at their markers when lookups finish in reverse order and opens the existing enlarged UI', async () => {
  let releaseFirst!: () => void;
  const firstPending = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  const { record, read } = getServerRequests();
  server.use(
    apiRoute(
      'getSagaScreenshot',
      {
        result: async (req) => {
          const { queries } = await req.json();
          const id = queries[0].refId;
          if (id === SAGA_UUID) {
            await firstPending;
          }
          return { json: sagaQueryResponse(sagaMetadata(id)) };
        },
      },
      record
    )
  );
  // A delayed marker arrives last but retains its capture timestamp.
  const entries = logs();
  const { user } = renderLogs(sortLogs([entries[0], entries[2], entries[3], entries[4], entries[1]]));
  const second = await screen.findByTestId('event-log-row-3');
  await waitFor(() =>
    expect(within(second).getByRole('img')).toHaveAttribute('src', sagaMetadata(SECOND_SAGA_UUID).url)
  );
  expect(within(screen.getByTestId('event-log-row-1')).getByText('Loading screenshot…')).toBeInTheDocument();
  releaseFirst();
  const first = screen.getByTestId('event-log-row-1');
  await waitFor(() => expect(within(first).getByRole('img')).toHaveAttribute('src', sagaMetadata().url));
  expect(screen.getAllByTestId(/event-log-row/).map((el) => el.getAttribute('data-testid'))).toEqual(
    [0, 1, 2, 3, 4].map((n) => `event-log-row-${n}`)
  );
  expect(screen.getByText('Between captures')).toBeInTheDocument();
  const { body } = await read();
  expect(body.queries[0]).toMatchObject({
    datasource: { uid: TEST_UID, type: INFINITY_DATASOURCE_TYPE },
    parser: 'backend',
    source: 'url',
    url_options: { method: 'GET' },
    url: `/api/v1alpha1/screenshots/${SAGA_UUID}`,
  });
  expect(SMDataSource.prototype.queryLogsV2).not.toHaveBeenCalled();
  expect(JSON.stringify(body)).not.toMatch(/Authorization|accessToken|basicAuthPassword/);
  await user.click(within(first).getByRole('button', { name: 'View full size: Screenshot' }));
  expect(within(await screen.findByRole('dialog')).getByRole('img')).toHaveAttribute('src', sagaMetadata().url);
});

it('does not guess another Infinity datasource when no explicit link exists', async () => {
  jest.replaceProperty(SM_DATASOURCE, 'jsonData', { ...SM_DATASOURCE.jsonData, screenshots: undefined });
  const { record, requests } = getServerRequests();
  server.use(apiRoute('getSagaScreenshot', {}, record));
  renderLogs();
  expect(await screen.findAllByText('Screenshot datasource is not configured or available.')).toHaveLength(2);
  expect(screen.getByText('After capture')).toBeInTheDocument();
  expect(requests).toHaveLength(0);
  expect(getScreenshotDatasource(SM_DATASOURCE.uid)).toBeUndefined();
});

it.each([404, 403, 500])('shows a recoverable status for a %s lookup failure', async (status) => {
  server.use(
    apiRoute('getSagaScreenshot', {
      result: async (req) => {
        const { queries } = await req.json();
        return { status: 400, json: { results: { [queries[0].refId]: { status, error: 'upstream error' } } } };
      },
    })
  );
  const { user } = renderLogs(logs().slice(0, 3));
  expect(
    await screen.findByText(
      status === 404 ? 'Screenshot is unavailable or has been removed.' : 'Could not load screenshot.'
    )
  ).toBeInTheDocument();
  expect(screen.getByText('Before capture')).toBeInTheDocument();
  server.use(apiRoute('getSagaScreenshot'));
  await user.click(screen.getByRole('button', { name: 'Retry screenshot' }));
  expect(await screen.findByRole('img', { name: 'Screenshot' })).toHaveAttribute('src', sagaMetadata().url);
});

it('lets the user retry a broken image', async () => {
  const { user } = renderLogs(logs().slice(0, 3));
  fireEvent.error(await screen.findByRole('img', { name: 'Screenshot' }));
  expect(screen.getByText('Could not load screenshot.')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Retry screenshot' }));
  expect(await screen.findByRole('img', { name: 'Screenshot' })).toBeInTheDocument();
});

it('refreshes expiring URLs through metadata and cancels refreshes on unmount', async () => {
  const { record, requests } = getServerRequests();
  server.use(
    apiRoute(
      'getSagaScreenshot',
      {
        result: () => ({
          json: sagaQueryResponse({ ...sagaMetadata(), url_expires_at: new Date(Date.now() + 2200).toISOString() }),
        }),
      },
      record
    )
  );
  const { unmount } = renderLogs(logs().slice(0, 3));
  await screen.findByRole('img', { name: 'Screenshot' });
  const refreshed = { ...sagaMetadata(), url: 'https://screenshots.example/refreshed.png?sig=new' };
  server.use(apiRoute('getSagaScreenshot', { result: () => ({ json: sagaQueryResponse(refreshed) }) }, record));
  await waitFor(() => expect(screen.getByRole('img', { name: 'Screenshot' })).toHaveAttribute('src', refreshed.url), {
    timeout: 3000,
  });
  expect(requests).toHaveLength(2);
  jest.useFakeTimers();
  unmount();
  await act(async () => {
    jest.advanceTimersByTime(20 * 60 * 1000);
  });
  expect(requests).toHaveLength(2);
  jest.useRealTimers();
});

it.each(['wrong UUID', 'expired', 'unsafe URL', 'invalid expiry', 'empty'])(
  'handles %s metadata without displaying the wrong image or looping',
  async (scenario) => {
    const metadata = sagaMetadata();
    if (scenario === 'wrong UUID') {
      metadata.uuid = SECOND_SAGA_UUID;
    }
    if (scenario === 'expired') {
      metadata.url_expires_at = new Date(Date.now() - 1000).toISOString();
    }
    if (scenario === 'unsafe URL') {
      metadata.url = 'javascript:alert(1)';
    }
    if (scenario === 'invalid expiry') {
      metadata.url_expires_at = 'not a date';
    }
    const { record, requests } = getServerRequests();
    server.use(
      apiRoute(
        'getSagaScreenshot',
        {
          result: () => ({
            json:
              scenario === 'empty'
                ? { results: { [SAGA_UUID]: { frames: [] } } }
                : sagaQueryResponse(metadata, SAGA_UUID),
          }),
        },
        record
      )
    );
    renderLogs(logs().slice(0, 3));
    await screen.findByRole('button', { name: 'Retry screenshot' });
    expect(screen.queryByRole('img', { name: 'Screenshot' })).not.toBeInTheDocument();
    expect(requests).toHaveLength(1);
  }
);

it('recognizes upstream 404 in Infinity frame metadata', async () => {
  server.use(
    apiRoute('getSagaScreenshot', {
      result: () => ({
        status: 400,
        json: {
          results: {
            [SAGA_UUID]: {
              status: 500,
              error: 'unsuccessful HTTP response',
              frames: [
                {
                  schema: { fields: [], meta: { custom: { responseCodeFromServer: 404 } } },
                  data: { values: [] },
                },
              ],
            },
          },
        },
      }),
    })
  );
  renderLogs(logs().slice(0, 3));
  expect(await screen.findByText('Screenshot is unavailable or has been removed.')).toBeInTheDocument();
});

it('ignores a late response after navigating to another execution', async () => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const { record, requests } = getServerRequests();
  server.use(
    apiRoute(
      'getSagaScreenshot',
      {
        result: async (req) => {
          const { queries } = await req.json();
          if (queries[0].refId === SAGA_UUID) {
            await pending;
          }
          return { json: sagaQueryResponse(sagaMetadata(queries[0].refId)) };
        },
      },
      record
    )
  );
  function ExecutionSwitch() {
    const [next, setNext] = useState(false);
    return (
      <>
        <button onClick={() => setNext(true)}>Next execution</button>
        <LogsEvent
          logs={next ? logs().slice(2) : logs().slice(0, 3)}
          mainKey="msg"
          from={next ? from + 1000 : from}
          to={to}
        />
      </>
    );
  }
  const { user } = render(<ExecutionSwitch />);
  await waitFor(() => expect(requests).toHaveLength(1));
  await user.click(screen.getByRole('button', { name: 'Next execution' }));
  expect(await screen.findByRole('img', { name: 'Screenshot' })).toHaveAttribute(
    'src',
    sagaMetadata(SECOND_SAGA_UUID).url
  );
  await act(async () => {
    release();
    await pending;
  });
  expect(screen.getAllByRole('img', { name: 'Screenshot' })).toHaveLength(1);
  expect(screen.getByRole('img', { name: 'Screenshot' })).toHaveAttribute('src', sagaMetadata(SECOND_SAGA_UUID).url);
});

it('does not perform lookups when screenshots are disabled', async () => {
  mockFeatureToggles({ [FeatureName.Screenshots]: false });
  const { record, requests } = getServerRequests();
  server.use(apiRoute('getSagaScreenshot', {}, record));
  renderLogs();
  expect(await screen.findByText(`screenshot:${SAGA_UUID}`)).toBeInTheDocument();
  expect(SMDataSource.prototype.queryLogsV2).not.toHaveBeenCalled();
  expect(requests).toHaveLength(0);
});

it('deduplicates UUID lookups while keeping every marker in place', async () => {
  const entries = logs();
  entries[3].labels.msg = `screenshot:${SAGA_UUID}`;
  const { record, requests } = getServerRequests();
  server.use(apiRoute('getSagaScreenshot', {}, record));
  renderLogs(entries);
  expect(await screen.findAllByRole('img', { name: 'Screenshot' })).toHaveLength(2);
  expect(requests).toHaveLength(1);
  expect(SMDataSource.prototype.queryLogsV2).not.toHaveBeenCalled();
});

it('does not treat old screenshot payload labels as images', async () => {
  const entries = logs().slice(0, 1);
  entries[0].labels.screenshot_base64 = 'AAAA';
  entries[0].labels.screenshot_url = 'https://customer.example/old.png';
  const { record, requests } = getServerRequests();
  server.use(apiRoute('getSagaScreenshot', {}, record));
  renderLogs(entries);
  expect(await screen.findByText('Before capture')).toBeInTheDocument();
  expect(screen.queryByRole('img', { name: 'Screenshot' })).not.toBeInTheDocument();
  expect(requests).toHaveLength(0);
});
