import { FeatureName } from 'types';

/**
 * Adding an entry routes all consumers of that FeatureName through OpenFeature
 * instead of legacy config.featureToggles. See docs/development/openfeature-migration.md.
 *
 * Kept out of featureFlags.ts: the FeatureName import pulls types.ts (and its
 * heavy dependencies) into the bundle, and featureFlags.ts is loaded at preload time.
 */
export const OPEN_FEATURE_KEYS: Partial<Record<FeatureName, string>> = {};
