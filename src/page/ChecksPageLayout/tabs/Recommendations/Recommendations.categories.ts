import {
  CategorySummary,
  Recommendation,
  RecommendationCategory,
  RecommendationCategoryId,
  RecommendationId,
  RecommendationSeverity,
} from './Recommendations.types';
import { Check } from 'types';

/**
 * Milestone 1 categories, in rail order. A category's severity is the severity of the findings
 * it holds; none of them mixes severities. Fleet reliability will join once execution data is
 * available to the tab.
 */
export const CATEGORIES: RecommendationCategory[] = [
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
  // Every finding belongs to exactly one category; the table above is exhaustive.
  return CATEGORIES.find((category) => category.findings.includes(id))!;
}

/**
 * The categories that currently have something to show, each with its findings and the number
 * of distinct checks they cover. A category whose findings are all dismissed or absent is left
 * out, so it disappears from the rail rather than sitting there empty.
 */
export function summariseCategories(visible: Recommendation[]): CategorySummary[] {
  return CATEGORIES.map((category) => {
    const findings = visible.filter((finding) => category.findings.includes(finding.id));

    return { category, findings, checkCount: countDistinctChecks(findings) };
  }).filter((summary) => summary.findings.length > 0);
}

/** How many distinct checks the findings cover between them. */
export function countDistinctChecks(findings: Recommendation[]): number {
  return new Set(findings.flatMap(({ checks }) => checks.map(getCheckKey))).size;
}

export interface LegendEntry {
  severity: RecommendationSeverity;
  checkCount: number;
}

/**
 * Distinct checks per severity across the given findings, most severe first, omitting severities
 * with nothing in them. Counting checks rather than findings keeps the legend comparable with
 * the rail and the overview line.
 */
export function getLegend(findings: Recommendation[]): LegendEntry[] {
  const severities: RecommendationSeverity[] = ['error', 'warning', 'info'];

  return severities
    .map((severity) => ({
      severity,
      checkCount: countDistinctChecks(
        findings.filter((finding) => getCategoryForFinding(finding.id).severity === severity)
      ),
    }))
    .filter((entry) => entry.checkCount > 0);
}

function getCheckKey(check: Check) {
  // Checks always have an id once they have been saved, which is the only kind the tab sees.
  return check.id ?? `${check.job}|${check.target}`;
}
