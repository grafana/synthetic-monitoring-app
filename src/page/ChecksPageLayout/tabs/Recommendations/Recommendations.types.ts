import { Check, CheckType } from 'types';

export type RecommendationSeverity = 'error' | 'warning' | 'info';

export enum RecommendationId {
  AlertingGaps = 'alerting-gaps',
  MissingCostLabels = 'missing-cost-labels',
  DuplicateChecks = 'duplicate-checks',
  OverlappingTargets = 'overlapping-targets',
  PausedChecks = 'paused-checks',
}

/** Also the `?category=` URL value. */
export enum RecommendationCategoryId {
  Alerting = 'alerting',
  Cost = 'cost',
  Paused = 'paused',
  Redundancy = 'redundancy',
}

export interface RecommendationCategory {
  id: RecommendationCategoryId;
  severity: RecommendationSeverity;
  findings: RecommendationId[];
}

export interface CategorySummary {
  category: RecommendationCategory;
  findings: Recommendation[];
  /** Distinct: a check in two findings counts once. */
  checkCount: number;
}

/** Checks that share something, e.g. a target; used by the redundancy findings. */
export interface RecommendationGroup {
  key: string;
  /** The shared thing, e.g. the target. */
  label: string;
  /** e.g. the check type the group shares. */
  detail?: string;
  /** Set when every check in the group is of one type. */
  type?: CheckType;
  checks: Check[];
}

export interface Recommendation {
  id: RecommendationId;
  /** Flattened across groups. Never empty. */
  checks: Check[];
  groups?: RecommendationGroup[];
}

/** Hidden check ids, by finding. */
export type DismissedChecks = Partial<Record<RecommendationId, number[]>>;

export interface RecommendationInputs {
  checks: Check[];
  /** Empty when CALs are unavailable. */
  calNames: string[];
}
