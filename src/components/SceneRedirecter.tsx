import React from 'react';
import { Navigate } from 'react-router-dom-v5-compat';

import { CheckAlertType } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { useChecks } from 'data/useChecks';
import { useURLSearchParams } from 'hooks/useURLSearchParams';
import { CenteredSpinner } from 'components/CenteredSpinner';

const ALERT_NAME_TO_TYPE: Record<string, CheckAlertType> = {
  ProbeFailedExecutionsTooHigh: CheckAlertType.ProbeFailedExecutionsTooHigh,
  TLSTargetCertificateCloseToExpiring: CheckAlertType.TLSTargetCertificateCloseToExpiring,
};

function parseAlertName(alertName: string): string {
  // Remove any content in brackets and extra whitespace
  return alertName.replace(/\s*\[.*?\]\s*/g, '').trim();
}

export function SceneRedirecter() {
  const urlSearchParams = useURLSearchParams();
  const job = urlSearchParams.get('var-job');
  const instance = urlSearchParams.get('var-instance');
  const alert = urlSearchParams.get('var-alert');
  const isRunbookRedirect = urlSearchParams.get('var-runbook') === 'true';
  const { data, isLoading } = useChecks();

  if (isLoading) {
    return <CenteredSpinner aria-label="Loading checks" />;
  }

  const check = data?.find((check) => check.job === job && check.target === instance);

  if (!check || !check.id) {
    return <Navigate to={generateRoutePath(AppRoutes.Home)} replace />;
  }

  if (isRunbookRedirect && alert) {
    const parsedAlertName = parseAlertName(alert);
    const alertType = ALERT_NAME_TO_TYPE[parsedAlertName];

    if (!alertType) {
      return <Navigate to={generateRoutePath(AppRoutes.CheckDashboard, { id: check.id })} replace />;
    }

    const alertConfig = check.alerts?.find((a) => a.name === alertType);

    //alertConfig.runbookUrl = 'https://example.com/runbooks/probe-failures';
    if (!alertConfig?.runbookUrl) {
      return <Navigate to={generateRoutePath(AppRoutes.CheckDashboard, { id: check.id })} replace />;
    }

    window.location.href = alertConfig.runbookUrl;
    return <CenteredSpinner aria-label="Redirecting to runbook" />;
  }

  return <Navigate to={generateRoutePath(AppRoutes.CheckDashboard, { id: check.id })} replace />;
}
