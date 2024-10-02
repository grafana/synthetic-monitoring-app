import { FeatureName } from 'types';
import { useFeatureFlag } from 'hooks/useFeatureFlag';

interface FlagProps {
  isEnabled: boolean;
}

interface Props {
  name: FeatureName;
  children: (flagProps: FlagProps) => JSX.Element | null;
}

export const FeatureFlag = ({ name, children }: Props) => {
  const { isEnabled } = useFeatureFlag(name);
  return children({ isEnabled });
};
