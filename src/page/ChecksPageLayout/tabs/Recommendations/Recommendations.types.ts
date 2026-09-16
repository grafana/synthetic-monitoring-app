import { Check, CheckType } from 'types';

/** How loudly a finding is presented, via the colour of its panel's leading edge. */
export type RecommendationSeverity = 'error' | 'warning' | 'info';

export enum RecommendationId {
  AlertingGaps = 'alerting-gaps',
  MissingCostLabels = 'missing-cost-labels',
  DuplicateChecks = 'duplicate-checks',
  OverlappingTargets = 'overlapping-targets',
  PausedChecks = 'paused-checks',
}

/**
 * Findings are grouped into categories, one of which is shown at a time, so the tab keeps a
 * bounded height however many findings are added. The ids double as the `?category=` URL value.
 */
export enum RecommendationCategoryId {
  Alerting = 'alerting',
  Cost = 'cost',
  Paused = 'paused',
  Redundancy = 'redundancy',
}

export interface RecommendationCategory {
  id: RecommendationCategoryId;
  severity: RecommendationSeverity;
  /** The findings this category holds, in presentation order. */
  findings: RecommendationId[];
}

/** A category together with the findings it currently holds for this tenant. */
export interface CategorySummary {
  category: RecommendationCategory;
  findings: Recommendation[];
  /** Distinct checks across the category's findings; a check in two findings counts once. */
  checkCount: number;
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
  /** Set when every check in the group is of one type, so the group can link to a type-filtered list. */
  type?: CheckType;
  checks: Check[];
}

export interface Recommendation {
  id: RecommendationId;
  /** Every affected check, flattened across groups. Never empty. */
  checks: Check[];
  groups?: RecommendationGroup[];
}

/** Per-check dismissals as persisted: the hidden check ids, by finding. */
export type DismissedChecks = Partial<Record<RecommendationId, number[]>>;

export interface RecommendationInputs {
  checks: Check[];
  /** Cost-attribution label names configured for the tenant. Empty when CALs are unavailable. */
  calNames: string[];
}
