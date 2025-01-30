import { CustomVariable, QueryVariable } from '@grafana/scenes';
import { DataSourceRef, VariableHide, VariableRefresh } from '@grafana/schema';

import { Check, CheckType } from 'types';

export function getVariables(checkType: CheckType, metrics: DataSourceRef, check: Check) {
  const probe = new QueryVariable({
    includeAll: true,
    allValue: '.*',
    defaultToAll: true,
    isMulti: true,
    name: 'probe',
    query: `label_values(sm_check_info{check_name="${checkType}"},probe)`,
    refresh: VariableRefresh.onDashboardLoad,
    datasource: metrics,
  });

  const job = new CustomVariable({
    name: 'job',
    query: check.job,
    value: check.job,
    text: check.job,
    hide: VariableHide.hideVariable,
  });
  const instance = new CustomVariable({
    name: 'instance',
    query: check.target,
    value: check.target,
    text: check.target,
    hide: VariableHide.hideVariable,
  });
  return { probe, job, instance };
}
