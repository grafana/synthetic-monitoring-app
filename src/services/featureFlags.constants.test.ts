import { FeatureName } from 'types';

import { SM_FEATURE_NAMES } from './featureFlags.constants';

describe('SM_FEATURE_NAMES', () => {
  it('stays aligned with production feature names', () => {
    const productionFeatureNames = Object.values(FeatureName).filter((name) => name !== FeatureName.__Turnoff);

    expect(Object.values(SM_FEATURE_NAMES)).toEqual(productionFeatureNames);
  });
});
