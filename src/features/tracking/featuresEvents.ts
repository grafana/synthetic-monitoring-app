// Staged for when the Features tab ships; nothing here fires yet. Uncomment this file and the
// call sites in FeaturesTab.tsx, then run `yarn build:analytics-events` to update
// docs/analytics/analytics-events.md.
//
// Events carry the flag as a property rather than in the event name, so every entry in
// ORG_FEATURES is tracked with no per-feature wiring: adding a feature to the allowlist starts
// reporting it, and removing the entry stops it.

// import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';
//
// import { OrgFeatureStage } from 'page/ConfigPageLayout/tabs/FeaturesTab/FeaturesTab.constants';
//
// const featuresEvents = createSMEventFactory('features');
//
// interface FeatureEvent extends TrackingEventProps {
//   /** The OpenFeature flag key, e.g. synthetic-monitoring.folders. */
//   feature: string;
//   /** The feature's release stage when the event fired. */
//   stage: OrgFeatureStage;
// }
//
// interface FeatureToggled extends FeatureEvent {
//   /** The value the user switched the feature to. */
//   enabled: boolean;
//   /** Whether the feature was enabled by Grafana before the user overrode it. */
//   enabled_by_grafana: boolean;
// }
//
// /** Tracks when a user switches a feature on or off. */
// export const trackFeatureToggled = featuresEvents<FeatureToggled>('feature_toggled');
//
// /** Tracks when a user resets a feature back to the value set by Grafana. */
// export const trackFeatureReset = featuresEvents<FeatureEvent>('feature_reset');
//
// /** Tracks when a user cancels the confirmation for turning on an experimental feature. */
// export const trackFeatureEnableCancelled = featuresEvents<FeatureEvent>('feature_enable_cancelled');
