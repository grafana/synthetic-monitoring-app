import type { PluginOptions } from '@grafana/plugin-e2e';

import { OPEN_FEATURE_KEYS, type SmFeatureName } from '../../../src/services/featureFlags.constants';

export type SmFeatureOverrides = Partial<Record<SmFeatureName, boolean>>;

type FeatureProfileOptions = Pick<PluginOptions, 'featureToggles' | 'openFeature'>;

/**
 * Translates SM feature names to the override mechanism used by the app today.
 * Tests remain unchanged when a flag moves from legacy Grafana boot data to OpenFeature.
 */
export function smFeatureProfile(overrides: SmFeatureOverrides): FeatureProfileOptions {
  const featureToggles: Record<string, boolean> = {};
  const openFeatureFlags: Record<string, boolean> = {};

  for (const [featureName, enabled] of Object.entries(overrides) as Array<[SmFeatureName, boolean | undefined]>) {
    if (enabled === undefined) {
      continue;
    }

    const openFeatureKey = OPEN_FEATURE_KEYS[featureName];
    if (openFeatureKey) {
      openFeatureFlags[openFeatureKey] = enabled;
    } else {
      featureToggles[featureName] = enabled;
    }
  }

  return {
    featureToggles,
    openFeature: { flags: openFeatureFlags },
  };
}
