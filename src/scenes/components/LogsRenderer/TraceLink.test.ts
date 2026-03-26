import { TRACE_ID_LABEL_NAMES, TRACE_LABEL_NAMES } from './TraceLink.constants';
import { getExploreTraceUrl, isTraceIdLabel, isTraceLabel } from './TraceLink.utils';

describe('isTraceLabel', () => {
  it.each([...TRACE_LABEL_NAMES])('returns true for %s', (label) => {
    expect(isTraceLabel(label)).toBe(true);
  });

  it.each(['trace', 'spanid', 'traceId_extracted', 'label_trace_id', 'msg'])('returns false for %s', (label) => {
    expect(isTraceLabel(label)).toBe(false);
  });
});

describe('isTraceIdLabel', () => {
  it.each([...TRACE_ID_LABEL_NAMES])('returns true for %s', (label) => {
    expect(isTraceIdLabel(label)).toBe(true);
  });

  const spanOnlyLabels = [...TRACE_LABEL_NAMES].filter((name) => !TRACE_ID_LABEL_NAMES.has(name));

  it.each(spanOnlyLabels)('returns false for span label %s', (label) => {
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
