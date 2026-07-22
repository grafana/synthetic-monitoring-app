import { dateTime, FieldType, LoadingState, PanelData } from '@grafana/data';

import { selectExecutionCounts, selectProbeReachabilityRows } from './httpHeaderSelectors';

function panelData(series: PanelData['series']): PanelData {
  return {
    state: LoadingState.Done,
    series,
    timeRange: { from: dateTime(0), to: dateTime(1), raw: { from: dateTime(0), to: dateTime(1) } },
  };
}

function probeFrame(refId: string, rows: Array<{ probe: string; value: number }>) {
  return {
    refId,
    fields: [
      { name: 'probe', type: FieldType.string, values: rows.map((row) => row.probe), config: {} },
      { name: 'Value', type: FieldType.number, values: rows.map((row) => row.value), config: {} },
    ],
    length: rows.length,
  };
}

describe('HTTP header selectors', () => {
  it('selects execution counts by stable ref id', () => {
    const data = panelData([
      probeFrame('successful', [{ probe: '', value: 4044 }]),
      probeFrame('failed', [{ probe: '', value: 52 }]),
      probeFrame('total', [{ probe: '', value: 4096 }]),
    ]);

    expect(selectExecutionCounts(data)).toEqual({ total: 4096, successful: 4044, failed: 52 });
  });

  it('joins and sorts per-probe reachability rows', () => {
    const data = panelData([
      probeFrame('reachability', [
        { probe: 'london', value: 1 },
        { probe: 'tokyo', value: 0.952 },
      ]),
      probeFrame('failed', [
        { probe: 'london', value: 0 },
        { probe: 'tokyo', value: 38 },
      ]),
    ]);

    expect(selectProbeReachabilityRows(data)).toEqual([
      { probe: 'tokyo', reachability: 0.952, failed: 38 },
      { probe: 'london', reachability: 1, failed: 0 },
    ]);
  });
});
