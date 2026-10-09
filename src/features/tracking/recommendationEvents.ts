import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

const recommendationEvents = createSMEventFactory('recommendations');

export interface TabViewed extends TrackingEventProps {
  /** Findings for this tenant, dismissed ones included. */
  findingCount: number;
  /** How many of those the user had dismissed. */
  dismissedCount: number;
  /** Checks the user had dismissed from findings that still apply. */
  dismissedCheckCount: number;
  /** How many checks the tenant has. */
  checkCount: number;
  /** Distinct checks covered by at least one finding, before any dismissal. */
  affectedCheckCount: number;
  /** Checks running without alerting, before any dismissal. */
  alertingGapsCount: number;
  /** Checks missing a cost attribution label, before any dismissal. */
  missingCostLabelsCount: number;
  /** Paused checks, before any dismissal. */
  pausedChecksCount: number;
  /** Checks in a duplicate group, before any dismissal. */
  duplicateChecksCount: number;
  /** Checks sharing a target with a check of another type, before any dismissal. */
  overlappingTargetsCount: number;
  /** How the user arrived: `tab` from the Checks page tab, `direct` for a URL, bookmark or refresh. */
  entryPoint: 'tab' | 'direct';
  /** The `RecommendationId` a `?finding=` link pointed at, if any. */
  focusFinding?: string;
  /** Milliseconds from opening the tab until every finding had its inputs. */
  durationMs: number;
  /** Whether cost attribution labels failed to load, so that finding could not be computed. */
  calsUnavailable: boolean;
}

/** Tracks a visit to the Recommendations tab. */
export const trackRecommendationsTabViewed = recommendationEvents<TabViewed>('tab_viewed');

interface FindingShown extends TrackingEventProps {
  /** The `RecommendationId` of the finding. */
  finding: string;
  /** How many checks the finding covers. */
  affectedCheckCount: number;
}

/** Tracks the first time a finding's panel is rendered in a visit. */
export const trackRecommendationShown = recommendationEvents<FindingShown>('finding_shown');

interface FindingActioned extends TrackingEventProps {
  /** The `RecommendationId` of the finding. */
  finding: string;
  /** What was clicked: the whole finding, a group within it, or a single check. */
  scope: 'finding' | 'group' | 'check';
}

/** Tracks a click through to the check list or a check's editor. */
export const trackRecommendationActioned = recommendationEvents<FindingActioned>('finding_actioned');

/** A change the tab makes itself. */
type TabAction = 'alerts_added' | 'check_resumed';

interface ActionCompleted extends TrackingEventProps {
  /** The `RecommendationId` of the finding. */
  finding: string;
  /** What was changed. */
  action: TabAction;
  /** How many checks the change reached. */
  checkCount: number;
  /** Whether it ran for the whole finding, the ticked rows, or a single check. */
  scope: 'finding' | 'selection' | 'check';
}

/** Tracks an action carried out from the tab itself. */
export const trackRecommendationActionCompleted = recommendationEvents<ActionCompleted>('action_completed');

interface ActionFailed extends TrackingEventProps {
  /** The `RecommendationId` of the finding. */
  finding: string;
  /** What was being changed. */
  action: TabAction;
  /** How many checks the change failed for. Cancelled work is not counted. */
  failedCount: number;
  /** Whether it ran for the whole finding, the ticked rows, or a single check. */
  scope: 'finding' | 'selection' | 'check';
}

/** Tracks an action from the tab failing for some or all of its checks. */
export const trackRecommendationActionFailed = recommendationEvents<ActionFailed>('action_failed');

interface FindingDismissed extends TrackingEventProps {
  /** The `RecommendationId` of the finding. */
  finding: string;
  /** Whether the whole finding was hidden or one check within it. */
  scope: 'finding' | 'check';
}

/** Tracks a finding, or a check within one, being hidden. */
export const trackRecommendationDismissed = recommendationEvents<FindingDismissed>('finding_dismissed');

/** Tracks hidden findings or checks being brought back. */
export const trackRecommendationRestored = recommendationEvents<FindingDismissed>('finding_restored');
