import React from 'react';
import { Badge } from '@grafana/ui';

import { CheckStatus } from 'types';

export const NewStatusBadge = ({ status, className }: { status: CheckStatus; className?: string }) => {
  if (![CheckStatus.EXPERIMENTAL, CheckStatus.PRIVATE_PREVIEW, CheckStatus.PUBLIC_PREVIEW].includes(status)) {
    return null;
  }

  return <Badge text={'NEW'} color={'orange'} className={className} />;
};
