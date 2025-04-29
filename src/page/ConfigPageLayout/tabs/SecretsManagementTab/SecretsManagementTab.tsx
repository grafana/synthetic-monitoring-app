import React from 'react';
import { SecretsManagementUI } from './SecretsManagementUI';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';

export function SecretsManagementTab() {
  return (
    <QueryErrorBoundary>
      <SecretsManagementUI />
    </QueryErrorBoundary>
  );
}
