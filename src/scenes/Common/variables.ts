import { QueryVariable } from '@grafana/scenes';
import { DataSourceRef, VariableRefresh } from '@grafana/schema';

import { Check, CheckType } from 'types';

export function getVariables(checkType: CheckType, metrics: DataSourceRef, checks: Check[]) {
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

  const job = new QueryVariable({
    name: 'job',
    label: 'Job',
    refresh: VariableRefresh.onDashboardLoad,
    query: `label_values(sm_check_info{check_name="${checkType}", probe=~"$probe"},job)`,

    datasource: metrics,
  });

  // This is to ensure the value of the job variable matches a check with correct check type
  job.addActivationHandler(() => {
    const value = job.getValue();
    if (value) {
      const found = checks.find((check) => check.job === value);
      if (!found) {
        job.changeValueTo(checks[0].job);
        instance.changeValueTo(checks[0].target);
      }
    }
    const sub = job.subscribeToState(({ value, loading }) => {
      if (!loading) {
        const found = checks.find((check) => check.job === value);
        if (!found) {
          job.changeValueTo(checks[0].job);
          instance.changeValueTo(checks[0].target);
        }
      }
    });
    return () => {
      sub.unsubscribe();
    };
  });

  const instance = new QueryVariable({
    name: 'instance',
    label: 'Instance',
    refresh: VariableRefresh.onDashboardLoad,
    query: `label_values(sm_check_info{check_name="${checkType}", job="$job", probe=~"$probe"},instance)`,
    datasource: metrics,
  });

  return { probe, job, instance };
}
