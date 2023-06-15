import { QueryVariable, SceneVariableSet } from '@grafana/scenes';
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
  });

  const job = new QueryVariable({
    name: 'job',
    $variables: new SceneVariableSet({ variables: [probe] }),
    query: { query: `label_values(sm_check_info{check_name="${checkType}", probe=~"$probe"},job)` },
    datasource: metrics,
  });

  const instance = new QueryVariable({
    name: 'instance',
    $variables: new SceneVariableSet({ variables: [probe, job] }),
    query: { query: `label_values(sm_check_info{check_name="${checkType}", job="$job", probe=~"$probe"},instance)` },
    datasource: metrics,
  });

  return [probe, job, instance];
  // const variableSet = new SceneVariableSet({ variables: [probe, job, instance] });
  // return variableSet;
}
