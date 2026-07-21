import { buildDatasourceRequests } from './buildRequests';

describe('buildDatasourceRequests', () => {
  it('groups visible targets by datasource and skips hidden targets', () => {
    const requests = buildDatasourceRequests({
      targets: [
        { refId: 'A', expr: 'a', datasource: { uid: 'prom-a', type: 'prometheus' } },
        { refId: 'B', expr: 'b', hidden: true, datasource: { uid: 'prom-a', type: 'prometheus' } },
        { refId: 'C', query: 'c', datasource: { uid: 'loki-a', type: 'loki' } },
      ],
      range: { from: 1, to: 2 },
      timezone: 'utc',
      interval: '30s',
      intervalMs: 30_000,
      maxDataPoints: 500,
      requestId: 'request-1',
      defaultDatasource: { uid: 'default-prom', type: 'prometheus' },
    });

    expect(requests).toHaveLength(2);
    expect(requests[0]).toMatchObject({
      datasourceUid: 'prom-a',
      targets: [{ refId: 'A', expr: 'a' }],
    });
    expect(requests[1]).toMatchObject({
      datasourceUid: 'loki-a',
      targets: [{ refId: 'C', query: 'c' }],
    });
  });
});
