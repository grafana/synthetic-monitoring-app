import React from 'react';
import { dateTimeFormat, LoadingState } from '@grafana/data';
import { screen, within } from '@testing-library/react';
import { executionLogsFactory } from 'test/factories/executionLogs';
import { TRACES_DATASOURCE } from 'test/fixtures/datasources';
import { render } from 'test/render';

import { LokiFieldNames } from 'features/parseLokiLogs/parseLokiLogs.types';

import { LogsEvent } from './LogsEvent';

const mockFetchTraceData = jest.fn();
jest.mock('./LogLine.utils', () => ({
  fetchTraceData: (...args: unknown[]) => mockFetchTraceData(...args),
}));

jest.mock('./TracePanel', () => ({
  TracePanel: ({ traceId, onClose, tracesDS }: { traceId: string; onClose: () => void; tracesDS: { uid: string } }) => (
    <div data-testid="trace-panel">
      <span>Trace: {traceId}</span>
      <a href={`/explore?trace=${traceId}&ds=${tracesDS.uid}`} title="Open in Explore">
        <button aria-label="Open trace in Explore" type="button">
          Explore
        </button>
      </a>
      <button onClick={onClose} aria-label="Close trace panel" type="button">
        Close
      </button>
    </div>
  ),
}));

const TRACE_ID = 'abc123def456ghi789';
const SPAN_ID = 'span789xyz000abc';

function addTracesDS() {
  const runtime = require('@grafana/runtime');
  jest.replaceProperty(runtime, 'config', {
    ...runtime.config,
    datasources: {
      ...runtime.config.datasources,
      [TRACES_DATASOURCE.name]: TRACES_DATASOURCE,
    },
  });
}

function buildLogsWithTraceLabels(extraLabels: Record<string, string> = {}) {
  return executionLogsFactory.build(undefined, {
    transient: {
      commonLabels: {
        probe: 'test',
        ...extraLabels,
      },
    },
  });
}

describe('LogsEvent', () => {
  const MAIN_KEY = 'msg';

  beforeEach(() => {
    mockFetchTraceData.mockReset();
  });

  it('should render all the logs correctly', async () => {
    const logs = executionLogsFactory.build(undefined, {
      transient: { commonLabels: { probe: 'test' } },
    });

    render(<LogsEvent logs={logs} mainKey={MAIN_KEY} />);
    const logLineElements = await screen.findAllByTestId(/event-log-/);

    logLineElements.forEach((el, index) => {
      expect(within(el).getByText(logs[index].labels[MAIN_KEY])).toBeInTheDocument();
      expect(within(el).getByText(logs[index].labels.level.toUpperCase())).toBeInTheDocument();
      expect(
        within(el).getByText(dateTimeFormat(logs[index][LokiFieldNames.TimeStamp], { defaultWithMS: true }))
      ).toBeInTheDocument();
    });

    const beginningCheckLog = logLineElements[0];
    expect(
      within(beginningCheckLog).getByText(`timeout_seconds=${logs[0].labels.timeout_seconds}`)
    ).toBeInTheDocument();
  });

  describe('when traces datasource is available and traces exist', () => {
    beforeEach(() => {
      addTracesDS();
      mockFetchTraceData.mockResolvedValue({
        state: LoadingState.Done,
        series: [{}],
        timeRange: { from: 0, to: 0, raw: { from: '0', to: '0' } },
      });
    });

    it('renders trace_id tag text in label=value format', async () => {
      const logs = buildLogsWithTraceLabels({ trace_id: TRACE_ID });
      render(<LogsEvent logs={logs} mainKey={MAIN_KEY} />);

      const traceTags = await screen.findAllByText(`trace_id=${TRACE_ID}`);
      expect(traceTags.length).toBeGreaterThan(0);
    });

    it('expands trace panel when clicking a trace_id tag', async () => {
      const logs = buildLogsWithTraceLabels({ trace_id: TRACE_ID });
      const { user } = render(<LogsEvent logs={logs} mainKey={MAIN_KEY} />);

      const chevrons = await screen.findAllByTestId('angle-right');
      await user.click(chevrons[0]);

      const tracePanels = await screen.findAllByTestId('trace-panel');
      expect(tracePanels.length).toBeGreaterThan(0);

      const firstLogElement = screen.getAllByTestId(/event-log-/)[0];
      expect(within(firstLogElement).getByText(`Trace: ${TRACE_ID}`)).toBeInTheDocument();
    });

    it('collapses trace panel when clicking the same trace_id tag again', async () => {
      const logs = buildLogsWithTraceLabels({ trace_id: TRACE_ID });
      const { user } = render(<LogsEvent logs={logs} mainKey={MAIN_KEY} />);

      const chevrons = await screen.findAllByTestId('angle-right');
      await user.click(chevrons[0]);
      expect((await screen.findAllByTestId('trace-panel')).length).toBeGreaterThan(0);

      const chevronDown = screen.getAllByTestId('angle-down')[0];
      await user.click(chevronDown);

      const firstLogElement = screen.getAllByTestId(/event-log-/)[0];
      expect(within(firstLogElement).queryByTestId('trace-panel')).not.toBeInTheDocument();
    });

    it('shows explore link in the expanded trace panel', async () => {
      const logs = buildLogsWithTraceLabels({ trace_id: TRACE_ID });
      const { user } = render(<LogsEvent logs={logs} mainKey={MAIN_KEY} />);

      const chevrons = await screen.findAllByTestId('angle-right');
      await user.click(chevrons[0]);

      const tracePanels = await screen.findAllByTestId('trace-panel');
      expect(within(tracePanels[0]).getByLabelText('Open trace in Explore')).toBeInTheDocument();
    });

    it('closes trace panel via the close button', async () => {
      const logs = buildLogsWithTraceLabels({ trace_id: TRACE_ID });
      const { user } = render(<LogsEvent logs={logs} mainKey={MAIN_KEY} />);

      const chevrons = await screen.findAllByTestId('angle-right');
      await user.click(chevrons[0]);
      expect((await screen.findAllByTestId('trace-panel')).length).toBeGreaterThan(0);

      const closeButtons = screen.getAllByLabelText('Close trace panel');
      await user.click(closeButtons[0]);

      const firstLogElement = screen.getAllByTestId(/event-log-/)[0];
      expect(within(firstLogElement).queryByTestId('trace-panel')).not.toBeInTheDocument();
    });

    it('does not expand trace panel when clicking a span_id tag', async () => {
      const logs = buildLogsWithTraceLabels({ span_id: SPAN_ID });
      const { user } = render(<LogsEvent logs={logs} mainKey={MAIN_KEY} />);

      const spanTag = await screen.findAllByText(`span_id=${SPAN_ID}`);
      await user.click(spanTag[0]);
      expect(screen.queryByTestId('trace-panel')).not.toBeInTheDocument();
    });
  });

  describe('when traces datasource is available but trace does not exist', () => {
    beforeEach(() => {
      addTracesDS();
      mockFetchTraceData.mockRejectedValue(new Error('404'));
    });

    it('renders trace labels as plain tags', async () => {
      const logs = buildLogsWithTraceLabels({ trace_id: TRACE_ID });
      render(<LogsEvent logs={logs} mainKey={MAIN_KEY} />);

      const traceTags = await screen.findAllByText(`trace_id=${TRACE_ID}`);
      expect(traceTags.length).toBeGreaterThan(0);
    });
  });

  describe('when trace lookup fails', () => {
    beforeEach(() => {
      addTracesDS();
      mockFetchTraceData.mockRejectedValue(new Error('Network error'));
    });

    it('shows a retry button when trace lookup fails', async () => {
      const logs = buildLogsWithTraceLabels({ trace_id: TRACE_ID });
      render(<LogsEvent logs={logs} mainKey={MAIN_KEY} />);

      const retryButtons = await screen.findAllByLabelText('Retry trace lookup');
      expect(retryButtons.length).toBeGreaterThan(0);
    });
  });

  describe('when traces datasource is NOT available', () => {
    it('renders trace labels as plain tags', async () => {
      const logs = buildLogsWithTraceLabels({ trace_id: TRACE_ID, span_id: SPAN_ID });
      render(<LogsEvent logs={logs} mainKey={MAIN_KEY} />);

      expect(await screen.findAllByText(`trace_id=${TRACE_ID}`)).toHaveLength(2);
      expect(screen.getAllByText(`span_id=${SPAN_ID}`)).toHaveLength(2);
    });
  });
});
