import { CheckType } from 'types';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';
import { UNATTRIBUTED_SENTINEL } from 'page/CheckList/CheckList.constants';

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
