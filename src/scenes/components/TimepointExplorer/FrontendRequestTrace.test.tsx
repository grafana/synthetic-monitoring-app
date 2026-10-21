import React, { useState } from 'react';
import { screen } from '@testing-library/react';
import { TRACES_DATASOURCE } from 'test/fixtures/datasources';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { PROPAGATION_WINDOW_MS } from 'scenes/components/LogsRenderer/LogLine.constants';

import { FrontendRequestTrace } from './FrontendRequestTrace';

jest.mock('scenes/components/LogsRenderer/LogLine.constants', () => ({
  ...jest.requireActual('scenes/components/LogsRenderer/LogLine.constants'),
  PROPAGATION_POLL_MS: 50,
}));

// Grafana supplies the trace visualization at runtime; exercise its data-loading boundary here.
jest.mock('scenes/components/LogsRenderer/TracePanel', () => ({
  TracePanel: ({ traceId }: { traceId: string }) => <div>Trace: {traceId}</div>,
}));

const TRACE_ID = 'abc123def456';
const TRACE_FRAME = {
  schema: { fields: [{ name: 'traceID', type: 'string' }] },
  data: { values: [[TRACE_ID]] },
};

function traceResponse(available: boolean) {
  return { json: { results: { [TRACE_ID]: { frames: available ? [TRACE_FRAME] : [] } } } };
}

function TraceToggle({ timestamp }: { timestamp: number }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button onClick={() => setOpen(!open)}>{open ? 'Hide trace' : 'Show trace'}</button>
      {open && (
        <FrontendRequestTrace
          traceId={TRACE_ID}
          timestamp={timestamp}
          tracesDS={TRACES_DATASOURCE}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

describe('FrontendRequestTrace', () => {
  it('reuses a loaded trace when another request references it at a different timestamp', async () => {
    const requests = getServerRequests();
    server.use(apiRoute('queryDatasource', { result: () => traceResponse(true) }, requests.record));
    const timestamp = Date.now() - PROPAGATION_WINDOW_MS;
    const { rerender } = render(
      <FrontendRequestTrace traceId={TRACE_ID} timestamp={timestamp} tracesDS={TRACES_DATASOURCE} onClose={() => {}} />
    );
    expect(await screen.findByText(`Trace: ${TRACE_ID}`)).toBeInTheDocument();

    rerender(
      <FrontendRequestTrace
        traceId={TRACE_ID}
        timestamp={timestamp + 1000}
        tracesDS={TRACES_DATASOURCE}
        onClose={() => {}}
      />
    );

    expect(await screen.findByText(`Trace: ${TRACE_ID}`)).toBeInTheDocument();
    expect(requests.requests).toHaveLength(1);
  });

  it('shows a recent trace automatically once it arrives', async () => {
    let available = false;
    server.use(apiRoute('queryDatasource', { result: () => traceResponse(available) }));

    render(<TraceToggle timestamp={Date.now()} />);
    expect(await screen.findByText('Waiting for the trace to arrive…')).toBeInTheDocument();

    available = true;
    expect(await screen.findByText(`Trace: ${TRACE_ID}`)).toBeInTheDocument();
  });

  it('allows retrying an empty response after the propagation window', async () => {
    let available = false;
    server.use(apiRoute('queryDatasource', { result: () => traceResponse(available) }));

    const { user } = render(<TraceToggle timestamp={Date.now() - PROPAGATION_WINDOW_MS} />);
    expect(await screen.findByText(/No trace found for this request/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try in Explore' })).toHaveAttribute('href', expect.stringContaining('/explore'));

    available = true;
    await user.click(screen.getByRole('button', { name: 'Retry trace lookup' }));
    expect(await screen.findByText(`Trace: ${TRACE_ID}`)).toBeInTheDocument();
  });

  it('distinguishes a failed lookup from an absent trace and recovers on retry', async () => {
    server.use(apiRoute('queryDatasource', { result: () => ({ status: 503 }) }));

    const { user } = render(<TraceToggle timestamp={Date.now() - PROPAGATION_WINDOW_MS} />);
    expect(await screen.findByText("Couldn't load the trace for this request.")).toBeInTheDocument();
    expect(screen.queryByText(/No trace found/)).not.toBeInTheDocument();

    server.use(apiRoute('queryDatasource', { result: () => traceResponse(true) }));
    await user.click(screen.getByRole('button', { name: 'Retry trace lookup' }));
    expect(await screen.findByText(`Trace: ${TRACE_ID}`)).toBeInTheDocument();
  });

  it('checks again when reopening a trace that was previously missing', async () => {
    let available = false;
    server.use(apiRoute('queryDatasource', { result: () => traceResponse(available) }));

    const { user } = render(<TraceToggle timestamp={Date.now() - PROPAGATION_WINDOW_MS} />);
    expect(await screen.findByText(/No trace found for this request/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hide trace' }));

    available = true;
    await user.click(screen.getByRole('button', { name: 'Show trace' }));
    expect(await screen.findByText(`Trace: ${TRACE_ID}`)).toBeInTheDocument();
  });
});
