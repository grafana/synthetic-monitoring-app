import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { FeatureName } from 'types';

interface FlagProps {
  isEnabled: boolean;
}

interface Props {
  name: FeatureName;
  children: (flagProps: FlagProps) => JSX.Element;
}

export const FeatureFlag = ({ name, children }: Props) => {
  const { isEnabled } = useFeatureFlag(name);
  return children({ isEnabled });
};
