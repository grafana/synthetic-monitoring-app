import { generatePath } from 'react-router-dom-v5-compat';
import { PathParam } from '@remix-run/router/utils';

import { CheckType, CheckTypeGroup, ROUTES } from '../types';
import { CHECK_TYPE_OPTIONS } from 'hooks/useCheckTypeOptions';
import { getRoute } from 'components/Routing.utils';

function checkTypeDirectFilter({ value, group }: { value: CheckType; group: CheckTypeGroup }) {
  return (group as string) !== (value as string);
}

export function getNewCheckTypeRedirects() {
  return CHECK_TYPE_OPTIONS.filter(checkTypeDirectFilter).map(({ value: checkType, group: checkTypeGroup }) => {
    if (checkTypeGroup === CheckTypeGroup.ApiTest) {
      return {
        checkType,
        checkTypeGroupUrl: `${checkTypeGroup}?checkType=${checkType}`,
      };
    }

    return {
      checkType,
      checkTypeGroup,
    };
  });
}

export function generateRoutePath<Path extends ROUTES>(
  route: Path,
  params: {
    [key in PathParam<Path>]: string | null | number;
  } = {} as any
) {
  // Important: this will throw if a route requires a param but the params object doesn't hold the param key/value
  return `${generatePath(getRoute(route), params)}`;
}