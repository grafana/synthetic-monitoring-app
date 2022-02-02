import { AlertDescription, AlertFormValues, AlertRule, AlertSensitivity, Label } from 'types';
import { ALERT_PROBE_SUCCESS_RECORDING_METRIC, ALERT_RULE_EXPR_REGEX } from 'components/constants';

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
    expr: `${ALERT_PROBE_SUCCESS_RECORDING_METRIC}{alert_sensitivity="${alertValues?.sensitivity?.value}"} < ${
      alertValues?.probePercentage ?? ''
    }`,
    for: `${alertValues?.timeCount}${alertValues?.timeUnit?.value}`,
    labels: labelToProm(alertValues?.labels),
    annotations: labelToProm(alertValues?.annotations),
  };
};

const isAlertSensitivity = (value: string): AlertSensitivity | undefined => {
  return ((Object.values(AlertSensitivity) as unknown) as string[]).includes(value)
    ? ((value as unknown) as AlertSensitivity)
    : undefined;
};

export const alertDescriptionFromRule = (rule: AlertRule): AlertDescription | undefined => {
  const result = ALERT_RULE_EXPR_REGEX.exec(rule.expr);
  if (!result) {
    return undefined;
  }

  const sensitivity = isAlertSensitivity(result?.groups?.sensitivity ?? '');
  if (!sensitivity) {
    return undefined;
  }

  const desc: AlertDescription = {
    metric: result?.groups?.metric ?? '',
    sensitivity: sensitivity,
    operator: result?.groups?.operator ?? '',
    threshold: Number(result?.groups?.threshold),
  };
  return desc;
};
