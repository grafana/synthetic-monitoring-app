import React, { PropsWithChildren } from 'react';

import { FeatureFlagContext, FeatureFlagContextValue,getFeatureContextValues } from 'contexts/FeatureFlagContext';

interface Props {
  overrides?: Partial<FeatureFlagContextValue>;
}

// Overrides are used for mocking tests
export const FeatureFlagProvider = ({ children, overrides }: PropsWithChildren<Props>) => {
  return (
    <FeatureFlagContext.Provider value={{ ...getFeatureContextValues(), ...(overrides ?? {}) }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};
