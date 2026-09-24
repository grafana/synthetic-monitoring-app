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

// Presentation order. All derived from check config alone, nothing from Mimir or Loki.
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

function findAlertingGaps({ checks }: RecommendationInputs): Recommendation | undefined {
  // A paused check cannot alert whatever its config; it belongs to the paused finding, not here too.
  const affected = checks.filter((check) => check.enabled && !checkHasAlerting(check));

  return toRecommendation(RecommendationId.AlertingGaps, affected);
}

function findMissingCostLabels({ checks, calNames }: RecommendationInputs): Recommendation | undefined {
  if (calNames.length === 0) {
    return undefined;
  }

  const affected = checks.filter((check) => getMissingCalNames(check.labels, calNames).length > 0);

  return toRecommendation(RecommendationId.MissingCostLabels, affected);
}

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

// Longest untouched first: those are the most likely forgotten.
function findPausedChecks({ checks }: RecommendationInputs): Recommendation | undefined {
  const affected = checks.filter((check) => !check.enabled).sort(byLeastRecentlyModified);

  return affected.length > 0 ? { id: RecommendationId.PausedChecks, checks: affected } : undefined;
}

// Pausing is a modification, so `modified` is when it was paused unless it was edited since.
export function getPausedSince(check: Check): Date | undefined {
  return check.modified ? new Date(check.modified * 1000) : undefined;
}

// Tolerates a hand-edited stored value.
export function getDismissedCheckIds(map: DismissedChecks | null | undefined, finding: RecommendationId): number[] {
  const ids = map?.[finding];

  return Array.isArray(ids) ? ids : [];
}

const MAX_LISTED_PROBES = 3;

// `Atlanta, London, Paris +4`. Probes the tenant can no longer see are counted but not named.
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
  // No timestamp sorts last.
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
