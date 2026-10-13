import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import { APP_ADHOC_RUN_ID, GCX_ADHOC_RUN_ID } from 'test/fixtures/adhocHistory';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { runTestWithoutLogsAccess } from 'test/utils';

import { AppRoutes } from 'routing/types';
import { generateRoutePath, getRoute } from 'routing/utils';
import { INSUFFICIENT_LOG_ACCESS_MESSAGE } from 'components/Checkster/feature/adhoc-check/constants';

import { REF_ID_ADHOC_HISTORY_LIST, REF_ID_ADHOC_HISTORY_RUN } from './adhocHistory.constants';
import { AdHocHistoryPage } from './AdHocHistoryPage';

function renderPage() {
  return render(<AdHocHistoryPage />, {
    path: generateRoutePath(AppRoutes.AdhocHistory),
    route: getRoute(AppRoutes.AdhocHistory),
  });
}

async function readQueries(requests: Request[]) {
  return Promise.all(
    requests.map(async (request) => {
      const body = await request.clone().json();
      return body.queries[0] as { refId: string; expr: string };
    })
  );
}

function getRunRow(text: string) {
  return screen.getByText(text).closest<HTMLElement>('[role="row"]')!;
}

async function expandRun(user: ReturnType<typeof render>['user'], runId: string) {
  await user.click(await screen.findByTestId(`expander-button-${runId}`));
}

describe('AdHocHistoryPage', () => {
  beforeEach(() => {
    server.use(apiRoute('getAdHocHistoryLogs'));
  });

  it('lists the test runs from every client, newest first', async () => {
    renderPage();

    expect(await screen.findByText('Grafana homepage')).toBeInTheDocument();

    const gcxRun = getRunRow('Grafana homepage');
    expect(within(gcxRun).getByText('https://grafana.com/')).toBeInTheDocument();
    expect(within(gcxRun).getByText('HTTP')).toBeInTheDocument();
    expect(within(gcxRun).getByText('gcx')).toBeInTheDocument();
    expect(within(gcxRun).getByText('Failed')).toBeInTheDocument();
    expect(within(gcxRun).getByText('1/2 probes passed')).toBeInTheDocument();

    const appRun = getRunRow('Example ping');
    expect(within(appRun).getByText('Synthetic Monitoring app')).toBeInTheDocument();
    expect(within(appRun).getByText('1/2 probes passed')).toBeInTheDocument();

    // runs published by agents that predate the run metadata still show up
    const oldRun = getRunRow('https://old.example.com/');
    expect(within(oldRun).getByText('Unknown')).toBeInTheDocument();
    expect(within(oldRun).getByText('1 probe reported')).toBeInTheDocument();

    const runTexts = screen.getAllByRole('row').map((row) => row.textContent ?? '');
    const order = ['Grafana homepage', 'Example ping', 'https://old.example.com/'].map((text) =>
      runTexts.findIndex((rowText) => rowText.includes(text))
    );
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('only fetches the run summary fields for the list', async () => {
    const { record, requests } = getServerRequests();
    server.use(apiRoute('getAdHocHistoryLogs', {}, record));

    renderPage();
    await screen.findByText('Grafana homepage');

    const queries = await readQueries(requests);
    const listQuery = queries.find((query) => query.refId.startsWith(REF_ID_ADHOC_HISTORY_LIST));

    expect(listQuery?.expr).toBe(
      `{source="synthetic-monitoring", type="adhoc"} | json id, target, check_name, job, client_type, success, duration_seconds, probes_requested | line_format "{{.id}}"`
    );
    expect(queries.some((query) => query.refId === REF_ID_ADHOC_HISTORY_RUN)).toBe(false);
  });

  it('filters the runs by client', async () => {
    const { user } = renderPage();
    await screen.findByText('Grafana homepage');

    await user.click(screen.getByRole('radio', { name: 'gcx' }));

    expect(screen.getByText('Grafana homepage')).toBeInTheDocument();
    expect(screen.queryByText('Example ping')).not.toBeInTheDocument();
    expect(screen.queryByText('https://old.example.com/')).not.toBeInTheDocument();
  });

  it('filters the runs by check type', async () => {
    const { user } = renderPage();
    await screen.findByText('Grafana homepage');

    await user.click(screen.getByRole('radio', { name: 'PING' }));

    expect(screen.getByText('Example ping')).toBeInTheDocument();
    expect(screen.queryByText('Grafana homepage')).not.toBeInTheDocument();
  });

  it('filters the runs by status', async () => {
    const { user } = renderPage();
    await screen.findByText('Grafana homepage');

    await user.click(screen.getByRole('radio', { name: 'Unknown' }));

    expect(screen.getByText('https://old.example.com/')).toBeInTheDocument();
    expect(screen.queryByText('Grafana homepage')).not.toBeInTheDocument();
    expect(screen.queryByText('Example ping')).not.toBeInTheDocument();
  });

  it('searches the runs by job and target', async () => {
    const { user } = renderPage();
    await screen.findByText('Grafana homepage');

    await user.type(screen.getByPlaceholderText('Search by job or target'), 'old.example');

    expect(screen.getByText('https://old.example.com/')).toBeInTheDocument();
    expect(screen.queryByText('Grafana homepage')).not.toBeInTheDocument();
  });

  it('shows a message when no run matches the filters', async () => {
    const { user } = renderPage();
    await screen.findByText('Grafana homepage');

    await user.type(screen.getByPlaceholderText('Search by job or target'), 'nothing matches this');

    expect(screen.getByText('No test runs match your filters.')).toBeInTheDocument();
  });

  it('shows the probe results and labels of an expanded run', async () => {
    const { record, requests } = getServerRequests();
    server.use(apiRoute('getAdHocHistoryLogs', {}, record));
    const { user } = renderPage();
    await screen.findByText('Grafana homepage');

    await expandRun(user, GCX_ADHOC_RUN_ID);

    expect(await screen.findByText('Frankfurt')).toBeInTheDocument();
    expect(screen.getByText('Tokyo')).toBeInTheDocument();
    expect(screen.getByText('env=prod')).toBeInTheDocument();
    expect(screen.getAllByText('Logs: 1, Metrics: 2')).toHaveLength(2);

    await user.click(screen.getByText('Tokyo'));
    expect(await screen.findByText('Tokyo failed')).toBeInTheDocument();

    const queries = await readQueries(requests);
    const runQuery = queries.find((query) => query.refId === REF_ID_ADHOC_HISTORY_RUN);
    expect(runQuery?.expr).toBe(`{source="synthetic-monitoring", type="adhoc"} |= "${GCX_ADHOC_RUN_ID}"`);
  });

  it('tells the user when requested probes never reported back', async () => {
    const { user } = renderPage();
    await screen.findByText('Example ping');

    await expandRun(user, APP_ADHOC_RUN_ID);

    expect(await screen.findByText('1 of 2 requested probes did not report a result.')).toBeInTheDocument();
  });

  it('shows an error when the runs cannot be loaded', async () => {
    server.use(
      apiRoute('getAdHocHistoryLogs', {
        result: () => ({ status: 500, json: { message: 'Loki is down' } }),
      })
    );

    renderPage();

    expect(await screen.findByText('Failed to load test runs')).toBeInTheDocument();
  });

  it('shows an empty state when there are no runs', async () => {
    server.use(
      apiRoute('getAdHocHistoryLogs', {
        result: async (req) => {
          const refId = new URL(req.url).searchParams.get('refId') ?? 'A';
          return { json: { results: { [refId]: { status: 200, frames: [] } } } };
        },
      })
    );

    renderPage();

    expect(await screen.findByText('No test runs found in this time range.')).toBeInTheDocument();
  });

  it('explains why nothing is shown without access to the logs datasource', async () => {
    runTestWithoutLogsAccess();
    const { record, requests } = getServerRequests();
    server.use(apiRoute('getAdHocHistoryLogs', {}, record));

    renderPage();

    expect(await screen.findByText(new RegExp(INSUFFICIENT_LOG_ACCESS_MESSAGE))).toBeInTheDocument();

    await waitFor(async () => {
      const queries = await readQueries(requests);
      expect(queries.some((query) => query.refId.startsWith(REF_ID_ADHOC_HISTORY_LIST))).toBe(false);
    });
  });
});
