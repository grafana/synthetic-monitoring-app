import React, { PropsWithChildren, useEffect, useState } from 'react';
import { OpenFeatureProvider } from '@openfeature/react-sdk';
import { initOpenFeature, isOpenFeatureInitialised, SM_OPEN_FEATURE_DOMAIN } from 'services/featureFlags';

export const SMOpenFeatureProvider = ({ children }: PropsWithChildren) => {
  const [initialised, setInitialised] = useState(isOpenFeatureInitialised);

  // init here (not module.tsx) to keep the preload bundle slim. Children mount only once the
  // provider has settled, so their first render sees final flag values rather than defaults.
  useEffect(() => {
    let cancelled = false;

    initOpenFeature().then(() => {
      if (!cancelled) {
        setInitialised(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return <OpenFeatureProvider domain={SM_OPEN_FEATURE_DOMAIN}>{initialised ? children : null}</OpenFeatureProvider>;
};
