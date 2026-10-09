import {
  CategorySummary,
  Recommendation,
  RecommendationCategory,
  RecommendationCategoryId,
  RecommendationId,
  RecommendationSeverity,
} from './Recommendations.types';
import { Check } from 'types';

// Rail order. Severity lives here only; panels, legend and rail all read it from the category.
export const CATEGORIES: RecommendationCategory[] = [
  // The only finding where doing nothing means a failure goes unseen.
  { id: RecommendationCategoryId.Alerting, severity: 'error', findings: [RecommendationId.AlertingGaps] },
  { id: RecommendationCategoryId.Cost, severity: 'warning', findings: [RecommendationId.MissingCostLabels] },
  { id: RecommendationCategoryId.Paused, severity: 'warning', findings: [RecommendationId.PausedChecks] },
  {
    id: RecommendationCategoryId.Redundancy,
    severity: 'info',
    findings: [RecommendationId.DuplicateChecks, RecommendationId.OverlappingTargets],
  },
];

export function isCategoryId(value: string | null | undefined): value is RecommendationCategoryId {
  return value != null && Object.values(RecommendationCategoryId).includes(value as RecommendationCategoryId);
}

export function getCategoryForFinding(id: RecommendationId): RecommendationCategory {
  return CATEGORIES.find((category) => category.findings.includes(id))!;
}

export function getFindingSeverity(id: RecommendationId): RecommendationSeverity {
  return getCategoryForFinding(id).severity;
}

// Categories with nothing left to show are left out, so they drop off the rail.
export function summariseCategories(visible: Recommendation[]): CategorySummary[] {
  return CATEGORIES.map((category) => {
    const findings = visible.filter((finding) => category.findings.includes(finding.id));

    return { category, findings, checkCount: countDistinctChecks(findings) };
  }).filter((summary) => summary.findings.length > 0);
}

export function countDistinctChecks(findings: Recommendation[]): number {
  return new Set(findings.flatMap(({ checks }) => checks.map(getCheckKey))).size;
}

export interface LegendEntry {
  severity: RecommendationSeverity;
  checkCount: number;
}

// Counts checks, not findings, so it lines up with the rail and the overview line.
export function getLegend(findings: Recommendation[]): LegendEntry[] {
  const severities: RecommendationSeverity[] = ['error', 'warning', 'info'];

  return severities
    .map((severity) => ({
      severity,
      checkCount: countDistinctChecks(findings.filter((finding) => getFindingSeverity(finding.id) === severity)),
    }))
    .filter((entry) => entry.checkCount > 0);
}

function getCheckKey(check: Check) {
  return check.id ?? `${check.job}|${check.target}`;
}
