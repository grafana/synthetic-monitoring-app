import { isFeatureEnabledThroughUrl } from './featureFlagUrlOverride';

const setUrlFeatures = (...features: string[]) => {
  const search = features.map((feature) => `features=${encodeURIComponent(feature)}`).join('&');
  window.history.replaceState({}, '', `/a/grafana-synthetic-monitoring-app/checks${search ? `?${search}` : ''}`);
};

afterEach(() => setUrlFeatures());

test('matches any of the given names against repeated ?features= params', () => {
  setUrlFeatures('a', 'b');
  expect(isFeatureEnabledThroughUrl('b')).toBe(true);
  expect(isFeatureEnabledThroughUrl('c', 'a')).toBe(true);
  expect(isFeatureEnabledThroughUrl('c')).toBe(false);
});

test('is false without the param', () => {
  expect(isFeatureEnabledThroughUrl('a')).toBe(false);
});
