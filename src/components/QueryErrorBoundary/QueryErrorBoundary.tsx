import React, { type ReactNode, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { QueryErrorResetBoundary } from '@tanstack/react-query';

import { CenteredSpinner } from 'components/CenteredSpinner';
import { ErrorAlert } from 'components/ErrorAlert';

interface QueryErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
  content?: ReactNode;
}

export function QueryErrorBoundary({
  children,
  fallback = <CenteredSpinner />,
  title,
  content,
}: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ resetErrorBoundary }) => (
            <ErrorAlert buttonText="Retry Request" content={content} onClick={resetErrorBoundary} title={title} />
          )}
        >
          <Suspense fallback={fallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
