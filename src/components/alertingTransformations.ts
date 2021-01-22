import { AlertFormValues, AlertRule, AlertSensitivity, Label } from 'types';

type PromLabel = { [key: string]: string };

export const labelToProm = (labels?: Label[]) => {
  return labels?.reduce<PromLabel>((acc, label) => {
    acc[label.name] = label.value;
    return acc;
  }, {});
};

export const transformAlertFormValues = (alertValues: AlertFormValues, sensitivity: AlertSensitivity): AlertRule => {
  return {
    alert: alertValues.name,
    expr: `probe_success * on (instance, job, probe, config_version) group_left (check_name) sm_check_info{alert_sensitivity="${sensitivity}"} < ${alertValues.probePercentage /
      100}`,
    for: `${alertValues.timeCount}${alertValues.timeUnit.value}`,
    labels: labelToProm(alertValues.labels),
    annotations: labelToProm(alertValues.annotations),
  };
};
