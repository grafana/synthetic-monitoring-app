import React from 'react';
import { Navigate } from 'react-router-dom-v5-compat';

import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { useChecks } from 'data/useChecks';
import { useURLSearchParams } from 'hooks/useURLSearchParams';
import { CenteredSpinner } from 'components/CenteredSpinner';

export function SceneRedirecter() {
  const urlSearchParams = useURLSearchParams();
  const job = urlSearchParams.get('var-job');
  const instance = urlSearchParams.get('var-instance');
  const { data, isLoading } = useChecks();

  if (isLoading) {
    return <CenteredSpinner aria-label="Loading checks" />;
  }

  const check = data?.find((check) => check.job === job && check.target === instance);

  if (!check || !check.id) {
    return <Navigate to={generateRoutePath(AppRoutes.Home)} replace />;
  }

  return <Navigate to={generateRoutePath(AppRoutes.CheckDashboard, { id: check.id })} replace />;
}
