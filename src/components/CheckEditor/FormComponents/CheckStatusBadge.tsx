import React from 'react';
import { Badge, BadgeColor } from '@grafana/ui';

import { CheckStatus } from 'types';

export const CheckStatusBadge = ({ status }: { status: CheckStatus }) => {
  const colorMap: Record<CheckStatus, { text: string; color: BadgeColor }> = {
    [CheckStatus.EXPERIMENTAL]: {
      color: 'orange',
      text: `Experimental`,
    },
    [CheckStatus.PRIVATE_PREVIEW]: {
        color: 'purple',
        text: `Private preview`,
      },
    [CheckStatus.PUBLIC_PREVIEW]: {
      color: 'blue',
      text: `Public preview`,
    },
  };

  const { text, color } = colorMap[status];

  return <Badge text={text} color={color} />;
};
