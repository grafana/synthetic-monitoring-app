import React, { PropsWithChildren, useEffect } from 'react';
import { OpenFeatureProvider } from '@openfeature/react-sdk';
import { initOpenFeature, SM_OPEN_FEATURE_DOMAIN } from 'services/featureFlags';

export const SmOpenFeatureProvider = ({ children }: PropsWithChildren) => {
  // init lives here (not module.tsx) to keep the preload bundle slim and to
  // avoid firing OFREP requests on Grafana pages that never open this app
  useEffect(() => {
    initOpenFeature();
  }, []);

  return <OpenFeatureProvider domain={SM_OPEN_FEATURE_DOMAIN}>{children}</OpenFeatureProvider>;
};
