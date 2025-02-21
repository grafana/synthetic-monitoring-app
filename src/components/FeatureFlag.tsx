import { ReactElement } from 'react';

import { FeatureName } from 'types';
import { useFeatureFlag } from 'hooks/useFeatureFlag';

interface FlagProps {
  isEnabled: boolean;
}

interface Props {
  name: FeatureName;
  children: (flagProps: FlagProps) => ReactElement | null;
}

export const FeatureFlag = ({ name, children }: Props) => {
  const { isEnabled } = useFeatureFlag(name);
  return children({ isEnabled });
};
