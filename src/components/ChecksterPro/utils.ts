import { ChecksterTypes } from './types';

/**
 * Get color for HTTP method
 *
 * Use in combination with `theme.visualization.getColorByName`
 *
 * @usage `theme.visualization.getColorByName(getMethodColor("GET"))`
 * @param method
 */
export function getMethodColor(method: ChecksterTypes.HTTPMethod) {
  const colorMap: Record<ChecksterTypes.HTTPMethod, string> = {
    DELETE: 'red',
    GET: 'green',
    HEAD: 'super-light-green',
    OPTIONS: 'dark-purple',
    PATCH: 'super-light-purple',
    POST: 'yellow',
    PUT: 'blue',
    // TRACE and CONNECT are not supported by old check creation flow
    // TRACE: theme.visualization.getColorByName('gray'),
    // CONNECT: theme.visualization.getColorByName('gray'),
  };

  return colorMap[method];
}
