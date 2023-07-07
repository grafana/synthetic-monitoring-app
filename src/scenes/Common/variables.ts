import { QueryVariable } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';
import { CheckType } from 'types';

export function getVariables(checkType: CheckType, metrics: DataSourceRef) {
  // Variable definition
  const probe = new QueryVariable({
    includeAll: true,
    allValue: '.*',
    defaultToAll: true,
    isMulti: true,
    name: 'probe',
    query: { query: `label_values(sm_check_info{check_name="${checkType}"},probe)` },
    datasource: metrics,
    skipUrlSync: false,
  });

  const job = new QueryVariable({
    name: 'job',
    query: { query: `label_values(sm_check_info{check_name="${checkType}", probe=~"$probe"},job)` },
    datasource: metrics,
    skipUrlSync: false,
  });

  const instance = new QueryVariable({
    name: 'instance',
    query: { query: `label_values(sm_check_info{check_name="${checkType}", job="$job", probe=~"$probe"},instance)` },
    datasource: metrics,
    skipUrlSync: false,
  });

  return { probe, job, instance };
}
