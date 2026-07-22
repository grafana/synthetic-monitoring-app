export const SM_FEATURE_NAMES = {
  CALs: 'synthetic-monitoring-cost-attribution',
  Folders: 'synthetic-monitoring-folders',
  GRPCChecks: 'grpc-checks',
  Screenshots: 'synthetic-monitoring-screenshots',
  SecretsManagement: 'synthetic-monitoring-secrets-management',
  TimepointExplorer: 'synthetic-monitoring-timepoint-explorer',
  VersionManagement: 'synthetic-monitoring-version-management',
} as const;

export type SmFeatureName = (typeof SM_FEATURE_NAMES)[keyof typeof SM_FEATURE_NAMES];

// Adding an entry routes all consumers of that FeatureName through OpenFeature instead
// of legacy config.featureToggles. See docs/development/openfeature-migration.md.
export const OPEN_FEATURE_KEYS: Partial<Record<SmFeatureName, string>> = {};
