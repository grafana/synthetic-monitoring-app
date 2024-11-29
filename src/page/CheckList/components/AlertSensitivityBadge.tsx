import React from 'react';
import { Badge, BadgeColor } from '@grafana/ui';

import { AlertSensitivity, Check } from 'types';

const colorMap: Record<string, BadgeColor> = {
  [AlertSensitivity.High]: `red`,
  [AlertSensitivity.Medium]: `orange`,
  [AlertSensitivity.Low]: `green`,
  // @ts-expect-error -- still renders as gray so whatevs
  [AlertSensitivity.None]: `gray`,
  custom: `purple`,
};

type AlertSensitivityBadgeProps = {
  alertSensitivity: Check['alertSensitivity'];
};

export const AlertSensitivityBadge = ({ alertSensitivity }: AlertSensitivityBadgeProps) => {
  const color = isAlertSensitivity(alertSensitivity) ? colorMap[alertSensitivity] : colorMap.custom;

  return <Badge text={alertSensitivity} color={color} icon="bell" />;
};

function isAlertSensitivity(arg: any): arg is AlertSensitivity {
  return Object.values(AlertSensitivity).includes(arg);
}
