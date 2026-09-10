import { Check } from 'types';

export enum RecommendationId {
  AlertingGaps = 'alerting-gaps',
  MissingCostLabels = 'missing-cost-labels',
  DuplicateChecks = 'duplicate-checks',
  OverlappingTargets = 'overlapping-targets',
  PausedChecks = 'paused-checks',
}

/**
 * A cluster of checks within a finding, used by the redundancy findings where the affected
 * checks only make sense grouped by what they have in common.
 */
export interface RecommendationGroup {
  key: string;
  /** What the group has in common, e.g. the shared target. */
  label: string;
  /** Qualifies the label, e.g. the check type the group shares. */
  detail?: string;
  checks: Check[];
}

export interface Recommendation {
  id: RecommendationId;
  /** Every affected check, flattened across groups. Never empty. */
  checks: Check[];
  groups?: RecommendationGroup[];
}

export interface RecommendationInputs {
  checks: Check[];
  /** Cost-attribution label names configured for the tenant. Empty when CALs are unavailable. */
  calNames: string[];
}
