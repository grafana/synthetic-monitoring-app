import React, { PropsWithChildren, useEffect } from 'react';
import { OpenFeatureProvider } from '@openfeature/react-sdk';
import { initOpenFeature, SM_OPEN_FEATURE_DOMAIN } from 'services/featureFlags';

export const SMOpenFeatureProvider = ({ children }: PropsWithChildren) => {
  // init here (not module.tsx) to keep the preload bundle slim and avoid
  // OFREP requests on Grafana pages that never open this app
  useEffect(() => {
    initOpenFeature();
  }, []);

  return <OpenFeatureProvider domain={SM_OPEN_FEATURE_DOMAIN}>{children}</OpenFeatureProvider>;
};
