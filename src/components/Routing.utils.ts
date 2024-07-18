import { ROUTES } from 'types';

import { PLUGIN_URL_PATH } from './Routing.consts';

export function getRoute(route: ROUTES) {
  return `${PLUGIN_URL_PATH}${route}`;
}
