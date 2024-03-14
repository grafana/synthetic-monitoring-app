// TODO: fix the duplication of these
// jest has an issue with circular dependencies
// we have to mock @grafana/data which the constant file imports so it breaks a bunch of tests
// the solution is to break up the constants to be more granular -- will do this in a separate PR

export const ALERT_PROBE_SUCCESS_RECORDING_METRIC = 'instance_job_severity:probe_success:mean5m';

export const ALERT_PROBE_SUCCESS_RECORDING_EXPR = `(sum without(probe, config_version) (rate(probe_all_success_sum[5m]) *
on(instance, job, probe) group_left(alert_sensitivity) max by(instance, job,
probe, alert_sensitivity) (sm_check_info{alert_sensitivity!=""})) / sum
without(probe, config_version) (rate(probe_all_success_count[5m]) *
on(instance, job, probe) group_left(alert_sensitivity) max by(instance, job,
probe, alert_sensitivity) (sm_check_info{alert_sensitivity!=""}))) * 100`;

export const DEFAULT_ALERT_LABELS = {
  namespace: 'synthetic_monitoring',
};

export const getDefaultAlertAnnotations = (percentage: number) => ({
  description: `check job {{ $labels.job }} instance {{ $labels.instance }} has a success rate of {{ printf "%.1f" $value }}%.`,
  summary: `check success below ${percentage}%`,
});

export const SM_ALERTING_NAMESPACE = 'synthetic_monitoring';
