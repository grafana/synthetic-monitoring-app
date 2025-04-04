import { useContext } from 'react';

import { FeatureFlagContext } from 'contexts/FeatureFlagContext';

export function useFeatureFlagContext() {
  return useContext(FeatureFlagContext);
}
