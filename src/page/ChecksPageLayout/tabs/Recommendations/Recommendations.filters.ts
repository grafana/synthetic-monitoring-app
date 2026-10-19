import { t } from '@grafana/i18n';

import { Recommendation, RecommendationGroup } from './Recommendations.types';
import { Check, CheckType, GrafanaFolder } from 'types';
import { getCheckType } from 'utils';
import { getFolderPath } from 'data/useFolders';
import { matchesFolderFilter, matchesLabelFilter } from 'page/CheckList/CheckList.utils';

import { UNESCAPED } from './Recommendations.constants';
import { describeCheckTypes } from './Recommendations.utils';

/** What the rail's filters have selected. A group with nothing selected doesn't constrain. */
export interface FilterSelection {
  types: CheckType[];
  /** `name: value`, as the check list's label filter writes them, so its matcher applies. */
  labels: string[];
  /** Folder uids. A check without a folder is in the default folder, as on the check list. */
  folders: string[];
}

/** The filters as a finding's panel needs them. */
export interface FindingFilter {
  isActive: boolean;
  matches: (check: Check) => boolean;
}

export const NO_FILTERS: FilterSelection = { types: [], labels: [], folders: [] };

// Repeated rather than comma-joined: label values can hold commas and colons.
const PARAMS: Record<keyof FilterSelection, string> = { types: 'type', labels: 'label', folders: 'folder' };

export function parseFilters(params: URLSearchParams): FilterSelection {
  return {
    types: params.getAll(PARAMS.types).filter(isCheckType),
    labels: params.getAll(PARAMS.labels),
    folders: params.getAll(PARAMS.folders),
  };
}

/** A copy of `params` holding `selection` in place of any filters it had, every other param kept. */
export function withFilters(params: URLSearchParams, selection: FilterSelection): URLSearchParams {
  const next = new URLSearchParams(params);

  (Object.keys(PARAMS) as Array<keyof FilterSelection>).forEach((group) => {
    next.delete(PARAMS[group]);
    selection[group].forEach((value) => next.append(PARAMS[group], value));
  });

  return next;
}

export function countSelected({ types, labels, folders }: FilterSelection): number {
  return types.length + labels.length + folders.length;
}

// OR within a group, AND across groups. Labels and folders match as the check list's filters do.
export function matchesRecommendationFilters(
  check: Check,
  { types, labels, folders }: FilterSelection,
  defaultFolderUid?: string
): boolean {
  return (
    (types.length === 0 || types.includes(getCheckType(check.settings))) &&
    matchesLabelFilter(check, labels) &&
    matchesFolderFilter(check, folders, defaultFolderUid)
  );
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

export function getLabelOptions(checks: Check[], selected: string[]): string[] {
  const labels = checks.flatMap((check) =>
    check.labels.filter(({ value }) => value).map(({ name, value }) => `${name}: ${value}`)
  );

  return [...new Set([...labels, ...selected])].sort();
}

export interface FolderOption {
  value: string;
  label: string;
}

/**
 * The folders checks are in, by title, or by path where two share one: folders under different
 * parents can. The default folder is marked as on the check list, since a stray copy of it can
 * share its title at the top level. A folder missing from `foldersByUid` shows its uid.
 */
export function getFolderOptions(
  checks: Check[],
  defaultFolderUid: string | undefined,
  foldersByUid: Map<string, GrafanaFolder>,
  selected: string[]
): FolderOption[] {
  const uids = new Set(selected);
  checks.forEach((check) => {
    const uid = check.folderUid ?? defaultFolderUid;

    if (uid) {
      uids.add(uid);
    }
  });

  const folders = [...uids].map((uid) => ({ uid, folder: foldersByUid.get(uid) }));
  const titles = folders.flatMap(({ folder }) => (folder ? [folder.title] : []));
  const isShared = (title: string) => titles.indexOf(title) !== titles.lastIndexOf(title);

  const getLabel = (uid: string, folder?: GrafanaFolder) => {
    if (!folder) {
      return uid;
    }

    if (uid === defaultFolderUid) {
      return t('recommendations.filters.defaultFolder', '{{title}} (default)', { title: folder.title, ...UNESCAPED });
    }

    return isShared(folder.title) ? getFolderPath(folder, foldersByUid) : folder.title;
  };

  return folders
    .map(({ uid, folder }) => ({ value: uid, label: getLabel(uid, folder) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function isCheckType(value: string): value is CheckType {
  return Object.values(CheckType).includes(value as CheckType);
}
