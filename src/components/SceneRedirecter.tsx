import React from 'react';
import { Navigate } from 'react-router-dom-v5-compat';
import { LoadingPlaceholder } from '@grafana/ui';

import { ROUTES } from 'types';
import { generateRoutePath } from 'routing/utils';
import { useChecks } from 'data/useChecks';
import { useQuery } from 'hooks/useQuery';

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
    return <Navigate to={generateRoutePath(ROUTES.Home)} replace />;
  }

  return <Navigate to={generateRoutePath(ROUTES.CheckDashboard, { id: check.id })} />;
}
