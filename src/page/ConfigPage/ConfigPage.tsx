import React from 'react';

import { FeatureName } from 'types';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { useMeta } from 'hooks/useMeta';

import { GeneralTab } from './tabs/GeneralTab';
import { ConfigPageV2 } from './ConfigPageV2';

export function ConfigPage({ initialized }: { initialized?: boolean }) {
  const meta = useMeta();
  const { isEnabled: isSecretsEnabled } = useFeatureFlag(FeatureName.SecretManagementDemo);

  if (isSecretsEnabled) {
    return <ConfigPageV2 meta={meta} initialized={initialized} />;
  }

  return <GeneralTab meta={meta} initialized={initialized} />;
}
