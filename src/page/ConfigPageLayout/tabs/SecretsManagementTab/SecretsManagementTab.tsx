import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorFallback } from './ErrorFallback';
import { SecretsManagementUI } from './SecretsManagementUI';

export function SecretsManagementTab() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <SecretsManagementUI />
    </ErrorBoundary>
  );
}
