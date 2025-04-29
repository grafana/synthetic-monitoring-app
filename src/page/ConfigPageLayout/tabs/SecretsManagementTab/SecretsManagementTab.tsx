import React from 'react';

import { QueryErrorBoundary } from 'components/QueryErrorBoundary';

import { SecretsManagementUI } from './SecretsManagementUI';

export function SecretsManagementTab() {
  return (
    <QueryErrorBoundary>
      <SecretsManagementUI />
    </QueryErrorBoundary>
  );
}
