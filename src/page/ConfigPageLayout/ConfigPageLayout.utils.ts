import { ROUTES } from 'types';
import { getRoute } from 'components/Routing.utils';

export function getConfigTabUrl(tab = '/') {
  return `${getRoute(ROUTES.Config)}/${tab}`.replace(/\/+/g, '/');
}
