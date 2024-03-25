import React from 'react';
import { LoadingPlaceholder } from '@grafana/ui';

import { ROUTES } from 'types';
import { useChecks } from 'data/useChecks';
import { useNavigation } from 'hooks/useNavigation';
import { useQuery } from 'hooks/useQuery';

import { PLUGIN_URL_PATH } from './constants';

export function SceneRedirecter() {
  const nav = useNavigation();
  const queryParams = useQuery();
  const job = queryParams.get('var-job');
  const instance = queryParams.get('var-instance');
  const { data, isLoading } = useChecks();

  if (isLoading) {
    return <LoadingPlaceholder text="Loading..." />;
  }

  const check = data?.find((check) => check.job === job && check.target === instance);

  if (!check || !check.id) {
    nav('/');
    return null;
  }

  nav(`${PLUGIN_URL_PATH}${ROUTES.Checks}/${check.id}/dashboard`, {}, true);

  return null;
}
