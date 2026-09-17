import React from 'react';
import { Badge } from '@grafana/ui';

import { CheckStatus } from 'types';

// For anything that isn't a check; `NewStatusBadge` when driven by a check's status.
export const NewBadge = ({ className }: { className?: string }) => (
  <Badge text={'NEW'} color={'orange'} className={className} />
);

export const NewStatusBadge = ({ status, className }: { status: CheckStatus; className?: string }) => {
  if (![CheckStatus.Experimental, CheckStatus.PrivatePreview, CheckStatus.PublicPreview].includes(status)) {
    return null;
  }

  return <NewBadge className={className} />;
};
