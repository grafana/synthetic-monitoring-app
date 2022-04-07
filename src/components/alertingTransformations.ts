import { AlertDescription, AlertFamily, AlertFormValues, AlertRule, AlertSensitivity, Label } from 'types';
import { ALERT_RULE_EXPR_REGEX, ALERT_METRIC_TO_ALERT_FAMILY_MAP } from 'components/constants';

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
    expr: `${alertValues?.metric}{alert_sensitivity="${alertValues?.sensitivity?.value}"} ${alertValues?.operator} ${
      alertValues?.threshold ?? ''
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

export const alertFamilyFromRule = (rule: AlertRule): AlertFamily | undefined => {
  const desc = alertDescriptionFromRule(rule);
  if (!desc) {
    return undefined;
  }

  const family = ALERT_METRIC_TO_ALERT_FAMILY_MAP.get(desc.metric);
  return family;
};
