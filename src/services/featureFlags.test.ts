import { FeatureName } from 'types';

import { getBooleanFlag, isFeatureEnabledThroughUrl, OPEN_FEATURE_KEYS } from './featureFlags';

const MAPPED_FLAG = FeatureName.CheckSuggestions;
const MAPPED_KEY = OPEN_FEATURE_KEYS[MAPPED_FLAG]!;

const setUrlFeatures = (...features: string[]) => {
  const search = features.map((feature) => `features=${encodeURIComponent(feature)}`).join('&');
  window.history.replaceState({}, '', `/a/grafana-synthetic-monitoring-app/checks${search ? `?${search}` : ''}`);
};

afterEach(() => setUrlFeatures());

describe('isFeatureEnabledThroughUrl', () => {
  test('matches any of the given names against repeated ?features= params', () => {
    setUrlFeatures('a', 'b');
    expect(isFeatureEnabledThroughUrl('b')).toBe(true);
    expect(isFeatureEnabledThroughUrl('c', 'a')).toBe(true);
    expect(isFeatureEnabledThroughUrl('c')).toBe(false);
  });

  test('is false without the param', () => {
    expect(isFeatureEnabledThroughUrl('a')).toBe(false);
  });
});

// The provider is never initialised here, so anything not forced by the URL is the default.
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
