import { AlertFormValues, AlertRule, Label } from 'types';
import { ALERT_RECORDING_METRIC } from 'components/constants';

type PromLabel = { [key: string]: string };

export const labelToProm = (labels?: Label[]) => {
  return labels?.reduce<PromLabel>((acc, label) => {
    acc[label.name] = label.value;
    return acc;
  }, {});
};

export const transformAlertFormValues = (alertValues: AlertFormValues | undefined): AlertRule => {
  return {
    alert: alertValues?.name ?? '',
    expr: `${ALERT_RECORDING_METRIC}{alert_sensitivity="${alertValues?.sensitivity?.value}"} < ${
      alertValues?.probePercentage ?? ''
    }`,
    for: `${alertValues?.timeCount}${alertValues?.timeUnit?.value}`,
    labels: labelToProm(alertValues?.labels),
    annotations: labelToProm(alertValues?.annotations),
  };
};
