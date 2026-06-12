import React, { PropsWithChildren, useEffect } from 'react';
import { OpenFeatureProvider } from '@openfeature/react-sdk';
import { initOpenFeature, SM_OPEN_FEATURE_DOMAIN } from 'services/featureFlags';

export const SmOpenFeatureProvider = ({ children }: PropsWithChildren) => {
  // idempotent fallback; init is normally kicked off earlier in module.tsx
  useEffect(() => {
    initOpenFeature();
  }, []);

  return <OpenFeatureProvider domain={SM_OPEN_FEATURE_DOMAIN}>{children}</OpenFeatureProvider>;
};
