import React, { FC } from 'react';
import { IconName, Icon } from '@grafana/ui';
import { Check } from 'types';
import { useMetricData } from 'hooks/useMetricData';

interface Props {
  check: Check;
}

const getIconName = (error: string | undefined, noData: boolean, uptime: number, enabled: boolean): IconName => {
  if (error) {
    return 'exclamation-triangle';
  }
  if (noData) {
    return 'question-circle';
  }
  if (!enabled) {
    return 'pause';
  }

  return uptime < 50 ? 'heart-break' : 'heart';
};

const getIconClassName = (error: string | undefined, noData: boolean, uptime: number, enabled: boolean): string => {
  if (error) {
    return 'critical';
  }
  if (noData) {
    return 'paused';
  }
  if (!enabled) {
    return 'paused';
  }
  if (uptime < 50) {
    return 'critical';
  }
  if (uptime < 99) {
    return 'warning';
  }
  return 'ok';
};

export const CheckHealth: FC<Props> = ({ check }) => {
  const filter = `instance="${check.target}", job="${check.job}"`;
  const query = `sum(probe_success{${filter}}) / count(probe_success{${filter}})`;
  const { data, error } = useMetricData(query);

  const noData = !data || data.length < 1;
  const uptime = parseFloat(data?.[0]?.value?.[1] ?? 0) * 100;
  return (
    <Icon
      name={getIconName(error, noData, uptime, check.enabled)}
      size="xxl"
      className={`alert-rule-item__icon alert-state-${getIconClassName(error, noData, uptime, check.enabled)}`}
    />
  );
};
