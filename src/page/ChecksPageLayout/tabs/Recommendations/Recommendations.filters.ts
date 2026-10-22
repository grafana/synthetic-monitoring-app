import { Recommendation, RecommendationGroup } from './Recommendations.types';
import { Check, CheckType } from 'types';
import { getCheckType } from 'utils';

import { describeCheckTypes } from './Recommendations.utils';

/** What the rail's filters have selected. A group with nothing selected doesn't constrain. */
export interface FilterSelection {
  types: CheckType[];
}

/** The filters as a finding's panel needs them. */
export interface FindingFilter {
  isActive: boolean;
  matches: (check: Check) => boolean;
}

export const NO_FILTERS: FilterSelection = { types: [] };

// Repeated rather than comma-joined, so a value never needs escaping.
const TYPE_PARAM = 'type';

export function parseFilters(params: URLSearchParams): FilterSelection {
  return { types: params.getAll(TYPE_PARAM).filter(isCheckType) };
}

/** A copy of `params` holding `filters` in place of any it had, every other param kept. */
export function withFilters(params: URLSearchParams, { types }: FilterSelection): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete(TYPE_PARAM);
  types.forEach((type) => next.append(TYPE_PARAM, type));

  return next;
}

export function countSelected({ types }: FilterSelection): number {
  return types.length;
}

// OR within a group, AND across groups.
export function matchesRecommendationFilters(check: Check, { types }: FilterSelection): boolean {
  return types.length === 0 || types.includes(getCheckType(check.settings));
}

/**
 * Each finding narrowed to its matching checks. A finding stays even when none match, so the page
 * keeps its shape; groups left empty go.
 */
export function filterFindings(findings: Recommendation[], matches: (check: Check) => boolean): Recommendation[] {
  return findings.map((finding) => ({
    ...finding,
    checks: finding.checks.filter(matches),
    groups: finding.groups && filterGroups(finding.groups, matches),
  }));
}

export function filterGroups(groups: RecommendationGroup[], matches: (check: Check) => boolean): RecommendationGroup[] {
  return groups
    .map((group) => {
      const checks = group.checks.filter(matches);

      // A duplicate group is one type by definition; an overlapping group lists its checks' types.
      return { ...group, checks, detail: group.type ? group.detail : describeCheckTypes(checks) };
    })
    .filter((group) => group.checks.length > 0);
}

// What is selected stays an option, so a type from a shared link can still be unticked.
export function getTypeOptions(checks: Check[], selected: CheckType[]): CheckType[] {
  return [...new Set([...checks.map((check) => getCheckType(check.settings)), ...selected])].sort();
}

function isCheckType(value: string): value is CheckType {
  return Object.values(CheckType).includes(value as CheckType);
}
