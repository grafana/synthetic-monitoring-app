import React from 'react';

import { useFeatureTabsContext } from '../contexts/FeatureTabsContext';

export function FeatureContent() {
  const { activeTab } = useFeatureTabsContext();

  const [, FeatureContentComponent] = activeTab;

  if (!FeatureContentComponent) {
    return null;
  }

  return <FeatureContentComponent />;
}
