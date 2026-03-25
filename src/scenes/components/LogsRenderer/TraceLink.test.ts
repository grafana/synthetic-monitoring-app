import { getExploreTraceUrl, isTraceIdLabel, isTraceLabel } from './TraceLink';

describe('isTraceLabel', () => {
  it.each(['trace_id', 'traceID', 'traceId', 'span_id', 'spanID', 'spanId'])('returns true for %s', (label) => {
    expect(isTraceLabel(label)).toBe(true);
  });

  it.each(['trace', 'spanid', 'traceId_extracted', 'label_trace_id', 'msg'])('returns false for %s', (label) => {
    expect(isTraceLabel(label)).toBe(false);
  });
});

describe('isTraceIdLabel', () => {
  it.each(['trace_id', 'traceID', 'traceId'])('returns true for %s', (label) => {
    expect(isTraceIdLabel(label)).toBe(true);
  });

  it.each(['span_id', 'spanID', 'spanId'])('returns false for span label %s', (label) => {
    expect(isTraceIdLabel(label)).toBe(false);
  });
});

describe('getExploreTraceUrl', () => {
  it('builds a URL with the datasource uid and trace id encoded as a left pane query', () => {
    const url = getExploreTraceUrl('grafanacloud-traces', 'abc123');
    expect(url).toContain('/explore?left=');

    const leftParam = decodeURIComponent(url.split('left=')[1]);
    const parsed = JSON.parse(leftParam);

    expect(parsed).toEqual({
      datasource: 'grafanacloud-traces',
      queries: [
        {
          refId: 'A',
          queryType: 'traceql',
          query: 'abc123',
        },
      ],
    });
  });
});
