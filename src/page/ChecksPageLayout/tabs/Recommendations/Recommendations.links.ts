import { isRecommendationId, RecommendationId } from './Recommendations.types';
import { CheckType } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath, getRoute } from 'routing/utils';
import { FORM_SECTION_QUERY_PARAM } from 'components/Checkster/constants';
import { FormSectionName } from 'components/Checkster/types';
import { UNATTRIBUTED_SENTINEL } from 'page/CheckList/CheckList.constants';

import { FilterSelection } from './Recommendations.filters';

/** How the user got onto the tab. */
export const SOURCE_PARAM = 'source';

/** On the check editor, the finding whose link opened it, so a save that fixes it can be credited. */
const RECOMMENDATION_PARAM = 'recommendation';

/** The ways onto the tab a dashboard can tell apart. Anything without a `source` is `direct`. */
const ENTRY_POINTS = ['tab'] as const;
export type RecommendationsEntryPoint = (typeof ENTRY_POINTS)[number] | 'direct';

export function getEntryPoint(source: string | null): RecommendationsEntryPoint {
  return ENTRY_POINTS.find((entryPoint) => entryPoint === source) ?? 'direct';
}

export function getRecommendationsTabUrl(tabUrl: string) {
  return `${tabUrl}?${SOURCE_PARAM}=tab`;
}

export function getEditCheckUrl(checkId: number, section?: FormSectionName, finding?: RecommendationId) {
  const url = generateRoutePath(AppRoutes.EditCheck, { id: checkId });
  const params = new URLSearchParams();

  if (section) {
    params.set(FORM_SECTION_QUERY_PARAM, section);
  }

  if (finding) {
    params.set(RECOMMENDATION_PARAM, finding);
  }

  const query = params.toString();

  return query ? `${url}?${query}` : url;
}

/** The finding whose link opened this page, if a Recommendations link did. */
export function getLinkedFinding(params: URLSearchParams): RecommendationId | undefined {
  const finding = params.get(RECOMMENDATION_PARAM);

  return isRecommendationId(finding) ? finding : undefined;
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
// The tab's label and folder filters carry over, so the list shows the checks the group did.
export function getChecksByTargetUrl(
  target: string,
  type: CheckType | undefined,
  { labels, folders }: Pick<FilterSelection, 'labels' | 'folders'>
) {
  const filters: Record<string, string> = { target };

  if (type) {
    filters.type = type;
  }

  if (labels.length > 0) {
    filters.labels = labels.join(',');
  }

  if (folders.length > 0) {
    filters.folders = folders.join(',');
  }

  return getCheckListUrl(filters);
}
