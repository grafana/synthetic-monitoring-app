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

// Duplicates narrow to one type; overlapping targets span several by definition.
export function getChecksByTargetUrl(target: string, type?: CheckType) {
  return getCheckListUrl(type ? { search: target, type } : { search: target });
}
