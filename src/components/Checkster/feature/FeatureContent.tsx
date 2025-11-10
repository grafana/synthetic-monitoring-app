import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { useFeatureTabsContext } from '../contexts/FeatureTabsContext';
import { FeatureError } from './FeatureError';

export function FeatureContent() {
  const { activeTab } = useFeatureTabsContext();

  const [feature, FeatureContentComponent] = activeTab;

  if (!FeatureContentComponent) {
    return null;
  }

  // return <FeatureContentComponent />;

  return (
    <ErrorBoundary
      fallbackRender={({ resetErrorBoundary, error }) => (
        <FeatureError onReset={resetErrorBoundary} error={error} feature={feature} />
      )}
      onReset={() => console.log('reset error')}
    >
      <FeatureContentComponent />
    </ErrorBoundary>
  );
}
