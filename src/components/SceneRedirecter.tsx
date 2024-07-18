import React from 'react';
import { Redirect } from 'react-router-dom';
import { LoadingPlaceholder } from '@grafana/ui';

import { ROUTES } from 'types';
import { useChecks } from 'data/useChecks';
import { useQuery } from 'hooks/useQuery';

import { PLUGIN_URL_PATH } from './Routing.consts';

export function SceneRedirecter() {
  const queryParams = useQuery();
  const job = queryParams.get('var-job');
  const instance = queryParams.get('var-instance');
  const { data, isLoading } = useChecks();

  if (isLoading) {
    return <LoadingPlaceholder text="Loading..." />;
  }

  const check = data?.find((check) => check.job === job && check.target === instance);

  if (!check || !check.id) {
    return <Redirect to={ROUTES.Home} />;
  }

  return <Redirect to={`${PLUGIN_URL_PATH}${ROUTES.Checks}/${check.id}/dashboard`} />;
}
