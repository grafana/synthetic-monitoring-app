import { ReactElement } from 'react';

import { FeatureName } from 'types';
import { useFeatureFlag } from 'hooks/useFeatureFlag';

interface FlagProps {
  isEnabled: boolean;
}

interface FeatureFlagProps {
  name: FeatureName;
  children: (flagProps: FlagProps) => ReactElement | null;
}

export const FeatureFlag = ({ name, children }: FeatureFlagProps) => {
  const { isEnabled } = useFeatureFlag(name);
  return children({ isEnabled });
};
