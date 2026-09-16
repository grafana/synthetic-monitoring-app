import { t } from '@grafana/i18n';

import {
  DismissedChecks,
  Recommendation,
  RecommendationGroup,
  RecommendationId,
  RecommendationInputs,
} from './Recommendations.types';
import { Check, CheckType, Probe } from 'types';
import { checkHasAlerting, getCheckType } from 'utils';
import { getMissingCalNames } from 'page/CheckList/CheckList.utils';

/**
 * Milestone 1 findings, all derived from check configuration alone so the tab needs nothing
 * from Mimir or Loki. Order is the order they are presented in: gaps that let failures go
 * unnoticed, then things that are not doing their job, then redundancy.
 */
const FINDERS: Array<(inputs: RecommendationInputs) => Recommendation | undefined> = [
  findAlertingGaps,
  findMissingCostLabels,
  findPausedChecks,
  findDuplicateChecks,
  findOverlappingTargets,
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
    .map<RecommendationGroup>((group) => {
      const type = getCheckType(group[0].settings);

      return { key: `${type}-${group[0].target}`, label: group[0].target, detail: type, type, checks: group };
    });

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

/**
 * D. Checks that were paused and never turned back on. The ones untouched for longest are the
 * most likely to have been forgotten, so they come first rather than sorting by name.
 */
function findPausedChecks({ checks }: RecommendationInputs): Recommendation | undefined {
  const affected = checks.filter((check) => !check.enabled).sort(byLeastRecentlyModified);

  return affected.length > 0 ? { id: RecommendationId.PausedChecks, checks: affected } : undefined;
}

/**
 * The configuration only records when a check was last modified, and pausing is a modification,
 * so for a check that has not been touched since this is when it was paused. Undefined when the
 * API did not send a timestamp.
 */
export function getPausedSince(check: Check): Date | undefined {
  return check.modified ? new Date(check.modified * 1000) : undefined;
}

/** The check ids hidden from one finding, or none; tolerates a hand-edited or stale stored value. */
export function getDismissedCheckIds(map: DismissedChecks | null | undefined, finding: RecommendationId): number[] {
  const ids = map?.[finding];

  return Array.isArray(ids) ? ids : [];
}

/** How many probe names to spell out before collapsing the rest into a count. */
const MAX_LISTED_PROBES = 3;

/**
 * The names of a check's probes, sorted, with a long list cut to `Atlanta, London, Paris +4`.
 * Probes the tenant can no longer see (deleted, or a public one since removed) are counted
 * but not named, so the total still matches the check's configuration.
 */
export function describeProbes(check: Check, probes: Probe[]): string {
  const names = check.probes
    .map((id) => probes.find((probe) => probe.id === id)?.name)
    .filter((name): name is string => Boolean(name))
    .sort((a, b) => a.localeCompare(b));
  const unnamedCount = check.probes.length - names.length;
  const listed = names.slice(0, MAX_LISTED_PROBES);
  const remainder = names.length - listed.length + unnamedCount;

  if (listed.length === 0) {
    return t('recommendations.probes.count', '{{probeCount}} probes', { probeCount: check.probes.length });
  }

  return remainder > 0
    ? t('recommendations.probes.listWithMore', '{{probes}} +{{remainder}}', { probes: listed.join(', '), remainder })
    : listed.join(', ');
}

function byLeastRecentlyModified(a: Check, b: Check) {
  // Checks without a timestamp cannot be ranked, so they go last.
  return (
    (a.modified ?? Number.POSITIVE_INFINITY) - (b.modified ?? Number.POSITIVE_INFINITY) || a.job.localeCompare(b.job)
  );
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
