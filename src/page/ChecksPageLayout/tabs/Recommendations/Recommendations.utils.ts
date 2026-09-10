import {
  Recommendation,
  RecommendationGroup,
  RecommendationId,
  RecommendationInputs,
} from './Recommendations.types';
import { Check, CheckType } from 'types';
import { checkHasAlerting, getCheckType } from 'utils';
import { getMissingCalNames } from 'page/CheckList/CheckList.utils';

/**
 * Milestone 1 findings, all derived from check configuration alone so the tab needs nothing
 * from Mimir or Loki. Order is the order they are presented in: gaps that let failures go
 * unnoticed come before cleanup.
 */
const FINDERS: Array<(inputs: RecommendationInputs) => Recommendation | undefined> = [
  findAlertingGaps,
  findMissingCostLabels,
  findDuplicateChecks,
  findOverlappingTargets,
  findPausedChecks,
];

export function computeRecommendations(inputs: RecommendationInputs): Recommendation[] {
  return FINDERS.map((finder) => finder(inputs)).filter((finding): finding is Recommendation => finding !== undefined);
}

/** A. Running checks whose failures would go unnoticed. */
function findAlertingGaps({ checks }: RecommendationInputs): Recommendation | undefined {
  // Paused checks cannot fire an alert whatever their configuration, so they belong to the
  // paused finding rather than counting twice here.
  const affected = checks.filter((check) => check.enabled && !checkHasAlerting(check));

  return toRecommendation(RecommendationId.AlertingGaps, affected);
}

/** B. Checks that cannot be attributed to a team because they are missing a cost label. */
function findMissingCostLabels({ checks, calNames }: RecommendationInputs): Recommendation | undefined {
  if (calNames.length === 0) {
    return undefined;
  }

  const affected = checks.filter((check) => getMissingCalNames(check.labels, calNames).length > 0);

  return toRecommendation(RecommendationId.MissingCostLabels, affected);
}

/** C(i). Several checks of the same type pointed at the same target. */
function findDuplicateChecks({ checks }: RecommendationInputs): Recommendation | undefined {
  const byTypeAndTarget = groupBy(checks, (check) => `${getCheckType(check.settings)}\u0000${check.target}`);

  const groups = Object.values(byTypeAndTarget)
    .filter((group) => group.length > 1)
    .map<RecommendationGroup>((group) => ({
      key: `${getCheckType(group[0].settings)}-${group[0].target}`,
      label: group[0].target,
      detail: getCheckType(group[0].settings),
      checks: group,
    }));

  return toGroupedRecommendation(RecommendationId.DuplicateChecks, groups);
}

/** C(ii). One target monitored by more than one kind of check. */
function findOverlappingTargets({ checks }: RecommendationInputs): Recommendation | undefined {
  const byTarget = groupBy(checks, (check) => check.target);

  const groups = Object.values(byTarget)
    .map<{ group: Check[]; types: CheckType[] }>((group) => ({
      group,
      types: uniq(group.map((check) => getCheckType(check.settings))),
    }))
    .filter(({ types }) => types.length > 1)
    .map<RecommendationGroup>(({ group, types }) => ({
      key: group[0].target,
      label: group[0].target,
      detail: types.join(', '),
      checks: group,
    }));

  return toGroupedRecommendation(RecommendationId.OverlappingTargets, groups);
}

/** D. Checks that were paused and never turned back on. */
function findPausedChecks({ checks }: RecommendationInputs): Recommendation | undefined {
  const affected = checks.filter((check) => !check.enabled);

  return toRecommendation(RecommendationId.PausedChecks, affected);
}

function toRecommendation(id: RecommendationId, checks: Check[]): Recommendation | undefined {
  return checks.length > 0 ? { id, checks: sortChecks(checks) } : undefined;
}

function toGroupedRecommendation(id: RecommendationId, groups: RecommendationGroup[]): Recommendation | undefined {
  if (groups.length === 0) {
    return undefined;
  }

  const sortedGroups = [...groups].sort((a, b) => b.checks.length - a.checks.length || a.label.localeCompare(b.label));

  return {
    id,
    checks: sortedGroups.flatMap((group) => group.checks),
    groups: sortedGroups.map((group) => ({ ...group, checks: sortChecks(group.checks) })),
  };
}

function sortChecks(checks: Check[]) {
  return [...checks].sort((a, b) => a.job.localeCompare(b.job));
}

function groupBy<T>(items: T[], getKey: (item: T) => string): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = getKey(item);
    acc[key] = acc[key] ?? [];
    acc[key].push(item);

    return acc;
  }, {});
}

function uniq<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}
