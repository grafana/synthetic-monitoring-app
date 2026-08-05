import { DataFrame } from '@grafana/data';

import { executedExpr } from './useVizPanelMenu';

// Captured from a running Grafana. A panel asking for a named query sends no
// expression, so the Explore link has to recover it from here; if this parsing
// breaks, Explore silently opens with nothing in it.
const PROMETHEUS_EXECUTED =
  'Expr: max by () (max_over_time(probe_success{job="test", instance="127.0.0.1", probe=~".*"}[60s]))\nStep: 1m0s';
const PROMETHEUS_EXPR =
  'max by () (max_over_time(probe_success{job="test", instance="127.0.0.1", probe=~".*"}[60s]))';
const LOKI_EXECUTED = 'Expr: {probe=~".*", instance="127.0.0.1", job="test", probe_success=~".*"} | logfmt';
const LOKI_EXPR = '{probe=~".*", instance="127.0.0.1", job="test", probe_success=~".*"} | logfmt';

function frame(refId: string, executedQueryString?: string): DataFrame {
  return { refId, fields: [], length: 0, meta: executedQueryString ? { executedQueryString } : undefined };
}

describe('executedExpr', () => {
  it('takes the expression from a Prometheus frame, without the trailing Step', () => {
    expect(executedExpr([frame('A', PROMETHEUS_EXECUTED)], 'A')).toBe(PROMETHEUS_EXPR);
  });

  it('takes the whole expression from a Loki frame, which has no trailing detail', () => {
    expect(executedExpr([frame('A', LOKI_EXECUTED)], 'A')).toBe(LOKI_EXPR);
  });

  it('matches on refId rather than taking the first frame', () => {
    const series = [frame('other', 'Expr: not_this_one'), frame('A', LOKI_EXECUTED)];

    expect(executedExpr(series, 'A')).toBe(LOKI_EXPR);
  });

  it('returns undefined when there is nothing to recover', () => {
    expect(executedExpr(undefined, 'A')).toBeUndefined();
    expect(executedExpr([], 'A')).toBeUndefined();
    expect(executedExpr([frame('A')], 'A')).toBeUndefined();
    expect(executedExpr([frame('B', LOKI_EXECUTED)], 'A')).toBeUndefined();
    expect(executedExpr([frame('A', 'Step: 1m0s')], 'A')).toBeUndefined();
  });

  it('keeps a multi-line expression intact', () => {
    const multiline = 'Expr: sum(\n  rate(probe_all_success_sum[5m])\n)\nStep: 30s';

    expect(executedExpr([frame('A', multiline)], 'A')).toBe('sum(\n  rate(probe_all_success_sum[5m])\n)');
  });
});
