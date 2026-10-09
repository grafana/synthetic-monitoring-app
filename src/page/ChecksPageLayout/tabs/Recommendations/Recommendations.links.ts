import { CheckType } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath, getRoute } from 'routing/utils';
import { FORM_SECTION_QUERY_PARAM } from 'components/Checkster/constants';
import { FormSectionName } from 'components/Checkster/types';
import { UNATTRIBUTED_SENTINEL } from 'page/CheckList/CheckList.constants';

/** How the user got onto the tab. */
export const SOURCE_PARAM = 'source';

/** The ways onto the tab a dashboard can tell apart. Anything without a `source` is `direct`. */
const ENTRY_POINTS = ['tab'] as const;
export type RecommendationsEntryPoint = (typeof ENTRY_POINTS)[number] | 'direct';

export function getEntryPoint(source: string | null): RecommendationsEntryPoint {
  return ENTRY_POINTS.find((entryPoint) => entryPoint === source) ?? 'direct';
}

export function getRecommendationsTabUrl(tabUrl: string) {
  return `${tabUrl}?${SOURCE_PARAM}=tab`;
}

export function getEditCheckUrl(checkId: number, section?: FormSectionName) {
  const url = generateRoutePath(AppRoutes.EditCheck, { id: checkId });

  return section ? `${url}?${FORM_SECTION_QUERY_PARAM}=${section}` : url;
}

// Param names and encodings have to match what `useCheckFilters` decodes.
function getCheckListUrl(filters: Record<string, string>) {
  const params = new URLSearchParams(filters);

  return `${getRoute(AppRoutes.Checks)}?${params.toString()}`;
}

export function getChecksWithoutAlertsUrl() {
  return getCheckListUrl({ alerts: 'without', status: 'enabled' });
}

export function getChecksMissingCostLabelsUrl(calNames: string[]) {
  return getCheckListUrl({ labels: calNames.map((name) => `${name}: ${UNATTRIBUTED_SENTINEL}`).join(',') });
}

export function getPausedChecksUrl() {
  return getCheckListUrl({ status: 'disabled' });
}

// An exact target filter, not a search: the generic search splits on `=` and substring-matches
// across target, job and labels, so it would pull in checks outside the group being cleaned up.
// Duplicates narrow to one type; overlapping targets span several by definition.
export function getChecksByTargetUrl(target: string, type?: CheckType) {
  return getCheckListUrl(type ? { target, type } : { target });
}
