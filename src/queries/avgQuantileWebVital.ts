import { DSQuery } from 'queries/queries.types';

interface P75AvgPageLoadQueryProps {
  job?: string;
  instance?: string;
  probe?: string;
  quantile?: number;
  by?: Array<`url` | `instance` | `job`>;
  metric:
    | `probe_browser_web_vital_fcp`
    | `probe_browser_web_vital_lcp`
    | `probe_browser_web_vital_ttfb`
    | `probe_browser_web_vital_cls`
    | `probe_browser_web_vital_fid`
    | `probe_browser_web_vital_inp`;
}

export function getAvgQuantileWebVital({
  job = '$job',
  instance = '$instance',
  probe = '$probe',
  quantile = 0.75,
  metric,
  by = [],
}: P75AvgPageLoadQueryProps): DSQuery {
  const byString = [`instance`, `job`, ...by].join(',');

  return {
    expr: `avg by (${byString}) (quantile_over_time(${quantile}, ${metric}{instance="${instance}", job="${job}", probe=~"${probe}"}[$__range]))`,
    queryType: 'range',
  };
}
