import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

const labelMigrationEvents = createSMEventFactory('label_migration');

interface FindPrefixedLabelsWithAssistantEvent extends TrackingEventProps {
  /**
   * Number of distinct check label keys named in the prompt. The keys
   * themselves are tenant authored, so they are customer data and not reported.
   */
  labelKeyCount: number;
  /** The tenant's label mode when the search was started. */
  labelMode: 'dual_write' | 'unprefixed';
}

/** Tracks when a user asks Grafana Assistant to find objects that still use prefixed check labels. */
export const trackFindPrefixedLabelsWithAssistant = labelMigrationEvents<FindPrefixedLabelsWithAssistantEvent>(
  'find_prefixed_labels_with_assistant_clicked'
);
