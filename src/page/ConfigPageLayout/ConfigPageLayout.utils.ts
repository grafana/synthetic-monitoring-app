import { ROUTES } from 'routing/types';
import { getRoute } from 'routing/utils';

export function getConfigTabUrl(tab = '/') {
  return `${getRoute(ROUTES.Config)}/${tab}`.replace(/\/+/g, '/');
}
