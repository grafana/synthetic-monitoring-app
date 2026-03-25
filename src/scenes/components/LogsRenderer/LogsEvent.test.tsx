import React from 'react';
import { dateTimeFormat } from '@grafana/data';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { executionLogsFactory } from 'test/factories/executionLogs';
import { TRACES_DATASOURCE } from 'test/fixtures/datasources';

import { LokiFieldNames } from 'features/parseLokiLogs/parseLokiLogs.types';
import { getExploreTraceUrl } from 'scenes/components/LogsRenderer/TraceLink';

import { LogsEvent } from './LogsEvent';

jest.mock('./TracePanel', () => ({
  TracePanel: ({ traceId, onClose }: { traceId: string; onClose: () => void }) => (
    <div data-testid="trace-panel">
      <span>Trace: {traceId}</span>
      <button onClick={onClose} aria-label="Close trace panel">
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

  it('should render all the logs correctly', () => {
    const logs = executionLogsFactory.build(undefined, {
      transient: {
        commonLabels: {
          probe: 'test',
        },
      },
    });

    render(<LogsEvent logs={logs} mainKey={MAIN_KEY} />);
    const logLineElements = screen.getAllByTestId(/event-log-/);

    logLineElements.forEach((el, index) => {
      const renderedMainKey = within(el).getByText(logs[index].labels[MAIN_KEY]);
      const renderedLevel = within(el).getByText(logs[index].labels.level.toUpperCase());
      const expectedTime = dateTimeFormat(logs[index][LokiFieldNames.TimeStamp], {
        defaultWithMS: true,
      });
      const logTime = within(el).getByText(expectedTime);

      expect(logTime).toBeInTheDocument();
      expect(renderedMainKey).toBeInTheDocument();
      expect(renderedLevel).toBeInTheDocument();
    });

    const beginningCheckLog = logLineElements[0];

    const beginningCheckLogTime = within(beginningCheckLog).getByText(
      `timeout_seconds=${logs[0].labels.timeout_seconds}`
    );

    expect(beginningCheckLogTime).toBeInTheDocument();
  });

  describe('when traces datasource is available', () => {
    beforeEach(() => {
      addTracesDS();
    });

    it('renders trace_id labels with an explore link', () => {
      const logs = buildLogsWithTraceLabels({ trace_id: TRACE_ID });
      render(<LogsEvent logs={logs} mainKey={MAIN_KEY} />);

      const exploreLinks = screen.getAllByLabelText('Open trace in Explore');
      expect(exploreLinks.length).toBeGreaterThan(0);

      const firstLink = exploreLinks[0].closest('a');
      expect(firstLink).toHaveAttribute('href', getExploreTraceUrl(TRACES_DATASOURCE.uid, TRACE_ID));
    });

    it('renders trace_id tag text in label=value format', () => {
      const logs = buildLogsWithTraceLabels({ trace_id: TRACE_ID });
      render(<LogsEvent logs={logs} mainKey={MAIN_KEY} />);

      const traceTags = screen.getAllByText(`trace_id=${TRACE_ID}`);
      expect(traceTags.length).toBeGreaterThan(0);
    });

    it('expands trace panels when clicking a trace_id tag', async () => {
      const user = userEvent.setup();
      const logs = buildLogsWithTraceLabels({ trace_id: TRACE_ID });
      render(<LogsEvent logs={logs} mainKey={MAIN_KEY} />);

      expect(screen.queryByTestId('trace-panel')).not.toBeInTheDocument();

      const traceTag = screen.getAllByText(`trace_id=${TRACE_ID}`)[0];
      await user.click(traceTag);

      const tracePanels = screen.getAllByTestId('trace-panel');
      expect(tracePanels.length).toBeGreaterThan(0);

      const firstLogElement = screen.getAllByTestId(/event-log-/)[0];
      expect(within(firstLogElement).getByText(`Trace: ${TRACE_ID}`)).toBeInTheDocument();
    });

    it('collapses all trace panels when clicking the same trace_id tag again', async () => {
      const user = userEvent.setup();
      const logs = buildLogsWithTraceLabels({ trace_id: TRACE_ID });
      render(<LogsEvent logs={logs} mainKey={MAIN_KEY} />);

      const traceTag = screen.getAllByText(`trace_id=${TRACE_ID}`)[0];
      await user.click(traceTag);
      expect(screen.getAllByTestId('trace-panel').length).toBeGreaterThan(0);

      await user.click(traceTag);
      expect(screen.queryByTestId('trace-panel')).not.toBeInTheDocument();
    });

    it('renders span_id labels with an explore link but does not expand a trace panel on click', async () => {
      const user = userEvent.setup();
      const logs = buildLogsWithTraceLabels({ span_id: SPAN_ID });
      render(<LogsEvent logs={logs} mainKey={MAIN_KEY} />);

      const spanTags = screen.getAllByText(`span_id=${SPAN_ID}`);
      expect(spanTags.length).toBeGreaterThan(0);

      const exploreLinks = screen.getAllByLabelText('Open trace in Explore');
      expect(exploreLinks.length).toBeGreaterThan(0);

      await user.click(spanTags[0]);
      expect(screen.queryByTestId('trace-panel')).not.toBeInTheDocument();
    });

    it('closes all trace panels via the close button', async () => {
      const user = userEvent.setup();
      const logs = buildLogsWithTraceLabels({ trace_id: TRACE_ID });
      render(<LogsEvent logs={logs} mainKey={MAIN_KEY} />);

      const traceTag = screen.getAllByText(`trace_id=${TRACE_ID}`)[0];
      await user.click(traceTag);
      expect(screen.getAllByTestId('trace-panel').length).toBeGreaterThan(0);

      const closeButton = screen.getAllByLabelText('Close trace panel')[0];
      await user.click(closeButton);
      expect(screen.queryByTestId('trace-panel')).not.toBeInTheDocument();
    });
  });

  describe('when traces datasource is NOT available', () => {
    it('renders trace labels as plain tags without explore links', () => {
      const logs = buildLogsWithTraceLabels({ trace_id: TRACE_ID, span_id: SPAN_ID });
      render(<LogsEvent logs={logs} mainKey={MAIN_KEY} />);

      expect(screen.getAllByText(`trace_id=${TRACE_ID}`).length).toBeGreaterThan(0);
      expect(screen.getAllByText(`span_id=${SPAN_ID}`).length).toBeGreaterThan(0);

      expect(screen.queryByLabelText('Open trace in Explore')).not.toBeInTheDocument();
    });

    it('does not render a trace panel when clicking a trace tag', async () => {
      const user = userEvent.setup();
      const logs = buildLogsWithTraceLabels({ trace_id: TRACE_ID });
      render(<LogsEvent logs={logs} mainKey={MAIN_KEY} />);

      const traceTag = screen.getAllByText(`trace_id=${TRACE_ID}`)[0];
      await user.click(traceTag);
      expect(screen.queryByTestId('trace-panel')).not.toBeInTheDocument();
    });
  });
});
