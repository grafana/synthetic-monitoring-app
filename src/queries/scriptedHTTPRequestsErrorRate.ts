import { DSQuery } from 'queries/queries.types';

interface ScriptedHTTPRequestsErrorRateQueryProps {
  labelName: string;
  labelValue: string;
  method: string;
  job?: string;
  instance?: string;
  probe?: string;
}

export function getScriptedHTTPRequestsErrorRateQuery({
  labelName,
  labelValue,
  method,
  job = `$job`,
  instance = `$instance`,
  probe = `$probe`,
}: ScriptedHTTPRequestsErrorRateQueryProps): DSQuery {
  return {
    expr: `sum by (probe, method) (
      probe_http_requests_failed_total{instance="${instance}", job="${job}", probe=~"${probe}", ${labelName}="${labelValue}", method="${method}"}
    )
    /
    sum by (probe, method) (
      probe_http_requests_total{instance="${instance}", job="${job}", probe=~"${probe}", ${labelName}="${labelValue}", method="${method}"}
    )`,
    queryType: `range`,
  };
}
