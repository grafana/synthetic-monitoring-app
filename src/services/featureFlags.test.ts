import { FeatureName } from 'types';

import { getBooleanFlag, OPEN_FEATURE_KEYS } from './featureFlags';

const MAPPED_FLAG = FeatureName.CheckSuggestions;
const MAPPED_KEY = OPEN_FEATURE_KEYS[MAPPED_FLAG]!;

const setUrlFeatures = (...features: string[]) => {
  const search = features.map((feature) => `features=${encodeURIComponent(feature)}`).join('&');
  window.history.replaceState({}, '', `/a/grafana-synthetic-monitoring-app/checks${search ? `?${search}` : ''}`);
};

afterEach(() => setUrlFeatures());

// No provider is initialised, so un-forced flags return the default.
describe('getBooleanFlag', () => {
  test('returns the default when the URL does not name the flag', () => {
    expect(getBooleanFlag(MAPPED_KEY)).toBe(false);
    expect(getBooleanFlag(MAPPED_KEY, true)).toBe(true);
  });

  test('is forced on by the OpenFeature key', () => {
    setUrlFeatures(MAPPED_KEY);
    expect(getBooleanFlag(MAPPED_KEY)).toBe(true);
  });

  test('is forced on by the FeatureName mapped to the key', () => {
    setUrlFeatures(MAPPED_FLAG);
    expect(getBooleanFlag(MAPPED_KEY)).toBe(true);
  });

  test('ignores other flags named in the URL', () => {
    setUrlFeatures(FeatureName.Folders, 'synthetic-monitoring.something-else');
    expect(getBooleanFlag(MAPPED_KEY)).toBe(false);
  });
});
