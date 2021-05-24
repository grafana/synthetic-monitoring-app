import React, { PropsWithChildren } from 'react';
import { FeatureFlagContext, getFeatureContextValues } from 'contexts/FeatureFlagContext';

interface Props {}

export const FeatureFlagProvider = ({ children }: PropsWithChildren<Props>) => {
  return <FeatureFlagContext.Provider value={getFeatureContextValues()}>{children}</FeatureFlagContext.Provider>;
};
